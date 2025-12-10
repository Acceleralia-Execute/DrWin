/**
 * Tools del módulo FIND
 * Funcionalidades para buscar oportunidades de financiación
 */

import { SearchOpportunitiesParams, ValidateGrantParams, CompareGrantsParams } from '../types';
import { GoogleGenAI } from '@google/genai';

const PROXY_URL = 'https://corsproxy.io/?';
const globalCache = new Map();
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper functions
async function fetchWithRetry(url: string, options: any = {}, maxRetries = 3, responseType = 'json', customCacheKey?: string) {
    const cacheKey = customCacheKey || `${url}_${JSON.stringify(options.body)}_${responseType}`;
    if (globalCache.has(cacheKey)) return globalCache.get(cacheKey);
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 404 && url.includes('boe.es')) {
                    const emptyResponse = responseType === 'json' ? {} : '';
                    globalCache.set(cacheKey, emptyResponse);
                    return emptyResponse;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = responseType === 'text' ? await response.text() : await response.json();
            globalCache.set(cacheKey, data);
            return data;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${i + 1} failed for ${url}:`, error);
            if (i < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
    throw lastError;
}

const getTimestampFromDate = (dateString: string): number | null => !dateString ? null : new Date(dateString).getTime();
const getEndOfDayTimestamp = (dateString: string): number | null => !dateString ? null : new Date(dateString + 'T23:59:59').getTime();

/**
 * Función auxiliar para extraer texto de un archivo PDF o DOCX
 */
async function extractTextFromFile(fileData: string, fileType: 'pdf' | 'docx'): Promise<string> {
    try {
        const mimeType = fileType === 'pdf' 
            ? 'application/pdf' 
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    text: "Extrae todo el texto de este documento y devuélvelo como texto plano, preservando la estructura, párrafos y formato básico."
                },
                {
                    inlineData: {
                        mimeType,
                        data: fileData,
                    }
                }
            ],
            config: {
                maxOutputTokens: 8000,
            },
        });
        
        return response.text.trim();
    } catch (error: any) {
        console.error('Error extracting text from file:', error);
        throw new Error(`Error al extraer texto del archivo: ${error.message}`);
    }
}

/**
 * Extraer keywords de un documento usando AI
 */
async function extractKeywordsFromDocument(documentText: string): Promise<string[]> {
    try {
        // Limitar el texto para no exceder tokens (usar primeros 5000 caracteres)
        const limitedText = documentText.substring(0, 5000);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Extrae las palabras clave más importantes de este documento para buscar oportunidades de financiación y subvenciones. 

Enfócate en:
- Tecnologías mencionadas
- Sectores o industrias
- Objetivos del proyecto
- Áreas de investigación o desarrollo
- Términos técnicos relevantes

Devuelve SOLO un array JSON de strings con las keywords más relevantes (máximo 10-15). No incluyas explicaciones, solo el array JSON.

DOCUMENTO:
${limitedText}

Formato de respuesta: ["keyword1", "keyword2", ...]`,
            config: {
                maxOutputTokens: 500,
            },
        });
        
        const responseText = response.text.trim();
        
        // Intentar extraer el array JSON
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                const keywords = JSON.parse(jsonMatch[0]);
                if (Array.isArray(keywords) && keywords.length > 0) {
                    return keywords.filter((kw: any) => typeof kw === 'string' && kw.length > 2);
                }
            } catch (parseError) {
                console.warn('Failed to parse keywords JSON:', parseError);
            }
        }
        
        // Fallback: extraer palabras significativas del texto
        const words = documentText
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((w: string) => w.length > 4)
            .filter((w: string) => !['proyecto', 'documento', 'memoria', 'técnica', 'propuesta'].includes(w));
        
        // Devolver las palabras más frecuentes (máximo 10)
        const wordCounts = new Map<string, number>();
        words.forEach((w: string) => {
            wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
        });
        
        return Array.from(wordCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    } catch (error: any) {
        console.error('Error extracting keywords:', error);
        throw new Error(`Error al extraer keywords: ${error.message}`);
    }
}

/**
 * Usar LLM para traducir keywords del español al inglés de forma genérica
 * La API de European Commission busca en documentos en inglés
 */
async function translateKeywordsToEnglish(keywords: string[]): Promise<string[]> {
    // Detectar si hay palabras en español (con acentos o caracteres especiales)
    const spanishIndicators = /[ñáéíóúüÑÁÉÍÓÚÜ]/;
    const hasSpanish = keywords.some(kw => spanishIndicators.test(kw));
    
    if (!hasSpanish) {
        // No parece haber español, devolver keywords originales
        return keywords;
    }
    
    try {
        const prompt = `Translate the following keywords/phrases from Spanish to English. 
Return ONLY a JSON array of strings with the English translations, maintaining the same order.
If a keyword is already in English, return it unchanged.
Do not add explanations, only return the JSON array.

Keywords to translate:
${keywords.map((kw, i) => `${i + 1}. ${kw}`).join('\n')}

Return format: ["translated1", "translated2", ...]`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                maxOutputTokens: 500,
            },
        });

        // Validar que la respuesta tenga texto
        if (!response || !response.text) {
            console.warn('LLM response missing text property, using original keywords');
            return keywords;
        }

        const responseText = response.text.trim();
        
        if (!responseText) {
            console.warn('LLM response text is empty, using original keywords');
            return keywords;
        }
        
        // Extraer JSON de la respuesta
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                const translated = JSON.parse(jsonMatch[0]);
                if (Array.isArray(translated) && translated.length === keywords.length) {
                    return translated;
                }
            } catch (parseError) {
                console.warn('Failed to parse translation JSON:', parseError);
            }
        }
        
        // Si falla el parsing, devolver originales
        console.warn('Failed to parse translation response, using original keywords');
        return keywords;
    } catch (error) {
        console.error('Error translating keywords with LLM:', error);
        // En caso de error, devolver keywords originales
        return keywords;
    }
}

/**
 * Usar LLM para expandir keywords con sinónimos y términos relacionados de forma genérica
 * Esto mejora la búsqueda semántica sin sesgar hacia casos específicos
 */
async function expandKeywordsWithLLM(keywords: string[]): Promise<string[]> {
    try {
        const prompt = `Given these keywords related to a project, generate a list of related terms, synonyms, and semantically related keywords that would help find relevant funding opportunities.
Return ONLY a JSON array of strings with the expanded keywords.
Include:
- Synonyms and alternative terms
- Related technical terms
- Broader and narrower concepts
- Terms commonly used in funding calls for similar projects
Do not add explanations, only return the JSON array.

Original keywords:
${keywords.map((kw, i) => `${i + 1}. ${kw}`).join('\n')}

Return format: ["keyword1", "keyword2", "related_term1", "synonym1", ...]`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                maxOutputTokens: 1000,
            },
        });

        // Validar que la respuesta tenga texto
        if (!response || !response.text) {
            console.warn('LLM response missing text property, no expansion applied');
            return [];
        }

        const responseText = response.text.trim();
        
        if (!responseText) {
            console.warn('LLM response text is empty, no expansion applied');
            return [];
        }
        
        // Extraer JSON de la respuesta
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                const expanded = JSON.parse(jsonMatch[0]);
                if (Array.isArray(expanded) && expanded.length > 0) {
                    // Devolver solo keywords expandidas (sin las originales)
                    // Las originales ya están en keywordsArray para el ranking
                    return expanded.filter((kw: string) => kw && typeof kw === 'string' && kw.trim().length > 0);
                }
            } catch (parseError) {
                console.warn('Failed to parse expansion JSON:', parseError);
            }
        }
        
        // Si falla el parsing, devolver array vacío (no expandir)
        console.warn('Failed to parse keyword expansion response, no expansion applied');
        return [];
    } catch (error) {
        console.error('Error expanding keywords with LLM:', error);
        // En caso de error, devolver keywords originales
        return keywords;
    }
}

const rankResults = (results: any[], keywords: string[], titleFields: string[], descriptionFields: string[]): any[] => {
    if (!keywords || keywords.length === 0) return results;
    const lowerKeywords = keywords.map(k => k.toLowerCase());
    const ranked = results.map(result => {
        let score = 0;
        const matchedKeywords = new Set<string>();
        const titleText = titleFields.map(field => (result[field] || '')).join(' ').toLowerCase();
        const descriptionText = descriptionFields.map(field => (result[field] || '')).join(' ').toLowerCase();
        lowerKeywords.forEach(keyword => {
            let isMatched = false;
            if (titleText.includes(keyword)) { score += 10; isMatched = true; }
            if (descriptionText.includes(keyword)) { score += 1; isMatched = true; }
            if (isMatched) matchedKeywords.add(keyword);
        });
        const matchCount = matchedKeywords.size;
        score += matchCount * 100;
        if (keywords.length > 1 && matchCount === keywords.length) score += 1000;
        return { ...result, relevanceScore: score };
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
    return ranked;
};

let facetMappings: any = { statusMapping: {}, programmeMapping: {} };
async function fetchFacetMappings() {
    // Avoid re-fetching if already populated
    if (Object.keys(facetMappings.statusMapping).length > 0) return;
    try {
        const API_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/facet?apiKey=SEDIA&text=***";
        const formData = new FormData();
        const query = { bool: { must: [{ terms: { type: ["1", "2", "8"] } }, { terms: { status: ["31094501", "31094502"] } }] } };
        formData.append('query', new Blob([JSON.stringify(query)], { type: 'application/json' }));
        formData.append('languages', new Blob([JSON.stringify(["en"])], { type: 'application/json' }));
        const response = await fetchWithRetry(PROXY_URL + encodeURIComponent(API_URL), { method: 'POST', body: formData });
        if (!response.facets) throw new Error("Facet fetch failed");
        response.facets.forEach((facet: any) => {
            if (facet.name === "status") {
                facet.values.forEach((item: any) => { facetMappings.statusMapping[item.rawValue] = item.value; });
            }
            if (facet.name === "frameworkProgramme") {
                facet.values.forEach((item: any) => { facetMappings.programmeMapping[item.rawValue] = item.value; });
            }
        });
    } catch (error) {
        console.error("Error fetching facet mappings:", error);
    }
}

const getStatusText = (statusCode: string) => facetMappings.statusMapping[statusCode] || "N/A";
const getProgrammeText = (programmeCode: string) => facetMappings.programmeMapping[programmeCode] || "N/A";

const processBudgetOverview = (budgetOverview: string) => {
    if (!budgetOverview) return "No disponible";
    try {
        const budgetData = JSON.parse(budgetOverview);
        const year = budgetData.budgetYearsColumns?.[0];
        const actionDetails = Object.values(budgetData.budgetTopicActionMap || {})[0]?.[0];
        if (actionDetails) {
            const amount = year && actionDetails.budgetYearMap?.[year];
            return amount ? `${amount.toLocaleString('es-ES')} €` : "No especificado";
        }
    } catch (error) { 
        console.error("Error parsing budget:", error); 
    }
    return "No disponible";
};

const processInfosubvencionesResults = (rawResults: any[]) => {
    return rawResults.map(item => ({
        source: 'Infosubvenciones',
        title: item.title || item.descripcion || "Sin título",
        url: `https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/${item.numeroConvocatoria}`,
        publication_date: item.fechaRecepcion || null,
        deadline_date: item.plazoPresentacion || "No disponible en API",
        description: item.descripcion || null,
        budget: item.importe ? `${Number(item.importe).toLocaleString('es-ES')} €` : "No disponible",
        numConvocatoria: item.numeroConvocatoria,
    }));
};

const processEuropeanResults = (rawResults: any[]) => {
    const getField = (result: any, fieldName: string) => result[fieldName] || result.metadata?.[fieldName]?.[0];
    return rawResults.map((result: any) => {
        const identifier = getField(result, 'identifier');
        return {
            source: 'European Commission',
            title: getField(result, 'title') || "No disponible",
            url: identifier ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${identifier}` : '#',
            publication_date: getField(result, 'startDate') || null,
            deadline_date: getField(result, 'deadlineDate') || null,
            description: getField(result, 'descriptionByte') || getField(result, 'description') || null,
            budget: processBudgetOverview(getField(result, 'budgetOverview')),
            // Extra info for display
            programme: getProgrammeText(getField(result, 'frameworkProgramme')),
            status: getStatusText(getField(result, 'status')),
        };
    });
};

const processBOEResults = (rawResults: any[]) => {
    return rawResults.map(item => ({
        source: 'BOE',
        title: item.title || "Sin título",
        url: item.urlHtml || '#',
        publication_date: item.date || null,
        deadline_date: "No disponible en sumario",
        description: null,
        budget: "No disponible en sumario",
    }));
};

/**
 * Buscar oportunidades de financiación
 */
export async function searchOpportunities(params: SearchOpportunitiesParams | any) {
    try {
        await fetchFacetMappings();
        
        // Normalizar keywords: convertir string a array si es necesario
        let keywords: string[] = [];
        if (params.keywords) {
            if (typeof params.keywords === 'string') {
                // Si es un string, dividirlo por comas y limpiar espacios
                keywords = params.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
            } else if (Array.isArray(params.keywords)) {
                keywords = params.keywords;
            }
        }

        // Si no hay keywords pero hay un archivo, extraer keywords del documento
        if ((!keywords || keywords.length === 0) && params.documentFile && params.fileType) {
            try {
                // Extraer texto del archivo
                const documentText = await extractTextFromFile(params.documentFile, params.fileType);
                
                // Extraer keywords del texto
                keywords = await extractKeywordsFromDocument(documentText);
                
                console.log('Keywords extraídas del documento:', keywords);
            } catch (error: any) {
                console.error('Error extrayendo keywords del documento:', error);
                return { 
                    error: `Error al procesar el documento: ${error.message}. Por favor, proporciona keywords manualmente o verifica que el archivo sea válido.` 
                };
            }
        }

        // Validar que keywords no esté vacío
        if (!keywords || keywords.length === 0) {
            return { error: 'Se requieren palabras clave para la búsqueda. Proporciona keywords directamente o adjunta un documento PDF/DOCX del cual extraerlas.' };
        }

        // Mapear filters a fundingTypes si viene en ese formato
        let fundingTypes = params.fundingTypes || {};
        if (params.filters) {
            const filters = params.filters;
            const type = filters.type;
            const scope = Array.isArray(filters.scope) ? filters.scope : (filters.scope ? [filters.scope] : []);
            
            // Mapear según el tipo y scope
            if (type === 'subvención' || type === 'grant') {
                fundingTypes.nationalSubsidies = scope.includes('nacional') || scope.includes('national');
                fundingTypes.internationalSubsidies = scope.includes('europeo') || scope.includes('european') || scope.includes('internacional') || scope.includes('international');
            } else if (type === 'licitación' || type === 'tender') {
                fundingTypes.nationalTenders = scope.includes('nacional') || scope.includes('national');
                fundingTypes.internationalTenders = scope.includes('europeo') || scope.includes('european') || scope.includes('internacional') || scope.includes('international');
            }
        }

        const {
            startDate,
            endDate,
        } = params;

        // MEJORADO: Detectar si hay tipos de financiación explícitamente especificados
        const hasExplicitFundingType = 
            fundingTypes.nationalSubsidies !== undefined || 
            fundingTypes.internationalSubsidies !== undefined ||
            fundingTypes.nationalTenders !== undefined ||
            fundingTypes.internationalTenders !== undefined;

        // Si el usuario especificó explícitamente solo internacionales, NO buscar en nacionales
        const onlyInternationalRequested = 
            hasExplicitFundingType && 
            fundingTypes.internationalSubsidies !== false &&
            (fundingTypes.nationalSubsidies === false || fundingTypes.nationalSubsidies === undefined);

        // Normalizar fundingTypes con valores por defecto inteligentes
        const normalizedFundingTypes = {
            // Si solo se pidieron internacionales, no buscar en nacionales
            // Si no se especificó nada, buscar en ambos por defecto
            nationalSubsidies: onlyInternationalRequested 
                ? false 
                : (fundingTypes.nationalSubsidies !== false),
            internationalSubsidies: fundingTypes.internationalSubsidies !== false,
            nationalTenders: fundingTypes.nationalTenders === true,
            internationalTenders: fundingTypes.internationalTenders === true,
        };


        const promises: Promise<any[]>[] = [];
        
        // Búsqueda en Infosubvenciones (subvenciones nacionales)
        if (normalizedFundingTypes.nationalSubsidies) {
            promises.push(searchInfosubvenciones(keywords, startDate));
        } else {
            promises.push(Promise.resolve([]));
        }
        
        // Búsqueda en European Commission (subvenciones internacionales)
        if (normalizedFundingTypes.internationalSubsidies) {
            promises.push(searchEuropeanGrants(keywords, startDate, endDate));
        } else {
            promises.push(Promise.resolve([]));
        }
        
        // Búsqueda en BOE (licitaciones nacionales) - requiere fechas
        if (normalizedFundingTypes.nationalTenders && startDate && endDate) {
            promises.push(searchBOE(keywords, startDate, endDate));
        } else {
            promises.push(Promise.resolve([]));
        }

        try {
            const [nationalGrants, internationalGrants, nationalTenders] = await Promise.all(promises);
            const allResults = [...nationalGrants, ...internationalGrants, ...nationalTenders];
            
            return {
                success: true,
                results: allResults,
                count: allResults.length,
                summary: {
                    nationalGrants: nationalGrants.length,
                    internationalGrants: internationalGrants.length,
                    nationalTenders: nationalTenders.length,
                }
            };
        } catch (error: any) {
            console.error('Error en searchOpportunities:', error);
            return { 
                error: `Error en la búsqueda: ${error.message}`,
                success: false,
                results: [],
                count: 0
            };
        }
    } catch (error: any) {
        console.error('Error general en searchOpportunities:', error);
        return { 
            error: `Error general en la búsqueda: ${error.message}`,
            success: false,
            results: [],
            count: 0
        };
    }
}

async function searchInfosubvenciones(keywords: string[] | string, start?: string): Promise<any[]> {
    try {
        // Asegurar que keywords sea un array
        const keywordsArray = Array.isArray(keywords) 
            ? keywords 
            : (typeof keywords === 'string' ? keywords.split(',').map(k => k.trim()).filter(Boolean) : []);
        
        if (keywordsArray.length === 0) return [];
        
        // INCREASED: size=100 (up from 50) per keyword to deepen the search
        const promises = keywordsArray.map(keyword => 
            fetchWithRetry(PROXY_URL + encodeURIComponent(`https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda?descripcion=${encodeURIComponent(keyword)}&size=100&page=0`))
        );
        const responses = await Promise.all(promises);
        const allContent = responses.flatMap(response => response.content || []);
        const uniqueResults = [...new Map(allContent.map((item: any) => [item.id, item])).values()];
        
        const startDateTimestamp = start ? new Date(start).getTime() : 0;
        const dateFilteredResults = uniqueResults.filter((item: any) => {
            if (!item.fechaRecepcion) return false;
            const itemDate = new Date(item.fechaRecepcion).getTime();
            return itemDate >= startDateTimestamp;
        });

        const parseDeadline = (deadlineString: string | null): Date | null => {
            if (!deadlineString || typeof deadlineString !== 'string') return null;
            const match = deadlineString.match(/Hasta (\d{2}\/\d{2}\/\d{4})/);
            if (!match || !match[1]) return null;
            const [day, month, year] = match[1].split('/');
            return new Date(Number(year), Number(month) - 1, Number(day));
        };
        
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const openCalls = dateFilteredResults.filter((item: any) => {
            const deadline = parseDeadline(item.plazoPresentacion);
            if (!deadline) return true;
            return deadline >= today;
        });

        const rankedResults = rankResults(openCalls, keywordsArray, ['title', 'descripcion'], ['descripcion']);
        return processInfosubvencionesResults(rankedResults.slice(0, 15));
    } catch (error: any) {
        console.error('Error en Infosubvenciones:', error);
        return [];
    }
}

async function searchEuropeanGrants(keywords: string[] | string, start?: string, end?: string): Promise<any[]> {
    try {
        // Asegurar que keywords sea un array
        let keywordsArray = Array.isArray(keywords) 
            ? keywords 
            : (typeof keywords === 'string' ? keywords.split(',').map(k => k.trim()).filter(Boolean) : []);
        
        if (keywordsArray.length === 0) return [];
        
        // Guardar keywords originales para el ranking
        const originalKeywords = [...keywordsArray];
        
        // MEJORADO: Usar LLM para traducir keywords del español al inglés
        // La API busca en documentos en inglés, por lo que necesitamos keywords en inglés
        // Si falla, usar keywords originales
        let translatedKeywords: string[];
        try {
            translatedKeywords = await translateKeywordsToEnglish(keywordsArray);
        } catch (error) {
            console.warn('Error translating keywords, using originals:', error);
            translatedKeywords = keywordsArray;
        }
        
        // MEJORADO: Expandir keywords con sinónimos y términos relacionados usando LLM
        // Esto mejora la búsqueda semántica de forma genérica
        // Si falla, usar solo keywords traducidas
        let expandedKeywords: string[];
        try {
            expandedKeywords = await expandKeywordsWithLLM(translatedKeywords);
        } catch (error) {
            console.warn('Error expanding keywords, using translated only:', error);
            expandedKeywords = translatedKeywords;
        }
        
        // Usar keywords expandidas para la búsqueda, pero mantener las originales y traducidas para ranking
        const allKeywordsForSearch = [...new Set([...translatedKeywords, ...expandedKeywords])];
        
        // Para el ranking, usar keywords traducidas como principales
        keywordsArray = translatedKeywords;
        
        const API_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?";
        
        let allResults: any[] = [];
        let pageNumber = 1;
        const pageSize = 50;
        const maxPages = 30;
        let hasMoreResults = true;
        
        const getField = (result: any, fieldName: string) => result[fieldName] || result.metadata?.[fieldName]?.[0];

        // Construct a broad search query usando keywords expandidas para mejor cobertura
        const searchText = allKeywordsForSearch.slice(0, 20).join(' '); // Limitar a 20 para evitar queries muy largas

        while (hasMoreResults && pageNumber <= maxPages) {
            const formData = new FormData();
            formData.append("apiKey", "SEDIA");
            formData.append("text", searchText);
            formData.append("pageSize", String(pageSize));
            formData.append("pageNumber", String(pageNumber));
            
            const query: any = {
                bool: {
                    must: [
                        { terms: { type: ["1", "2", "8"] } },
                        { terms: { status: ["31094501", "31094502"] } },
                        { term: { programmePeriod: "2021 - 2027" } },
                        { term: { language: "en" } }
                    ]
                }
            };

            if (start) {
                query.bool.must.push({ range: { startDate: { gte: getTimestampFromDate(start) } } });
            }
            
            const effectiveEndDate = end || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
            query.bool.must.push({ range: { deadlineDate: { lte: getEndOfDayTimestamp(effectiveEndDate) } } });
            
            formData.append("sort", new Blob([JSON.stringify({"order":"DESC","field":"startDate"})], { type: "application/json" }));
            formData.append("query", new Blob([JSON.stringify(query)], { type: "application/json" }));
            formData.append("displayFields", new Blob([JSON.stringify(["title", "identifier", "deadlineDate", "startDate", "descriptionByte", "description", "status", "frameworkProgramme", "budgetOverview", "callTitle"])], { type: "application/json" }));
            
            const cacheKey = `EU_${searchText}_PAGE_${pageNumber}_START_${start}_END_${end}`;
            
            try {
                const response = await fetchWithRetry(API_URL, { method: "POST", body: formData }, 3, 'json', cacheKey);
                
                if (response && response.results && Array.isArray(response.results) && response.results.length > 0) {
                    allResults = [...allResults, ...response.results];
                    
                    if (response.results.length < pageSize) {
                        hasMoreResults = false;
                    } else {
                        pageNumber++;
                    }
                } else {
                    hasMoreResults = false;
                }
            } catch (fetchError: any) {
                console.error(`[European Commission] Error en página ${pageNumber}:`, fetchError.message);
                hasMoreResults = false;
            }
        }

        const uniqueResults = [...new Map(allResults.map(item => [getField(item, 'identifier'), item])).values()];
        
        // Normalizar palabras clave: convertir a minúsculas y normalizar acentos
        const normalizeText = (text: string) => {
            return text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
        };
        
        // MEJORADO: Para el ranking, usar keywords originales, traducidas Y expandidas
        // Esto permite mejor matching semántico
        const keywordsForRanking = [...new Set([...originalKeywords, ...keywordsArray, ...expandedKeywords])];
        const lowerKeywords = keywordsForRanking.map(k => normalizeText(k));
        
        // Separar keywords principales (originales/traducidas) de expandidas para darles más peso
        const primaryKeywords = [...new Set([...originalKeywords, ...keywordsArray])].map(k => normalizeText(k));
        const expandedLowerKeywords = expandedKeywords.filter(k => !keywordsArray.includes(k) && !originalKeywords.includes(k)).map(k => normalizeText(k));
        
        const rankedResults = uniqueResults.map((result: any) => {
            let score = 0;
            const matchedKeywords = new Set<string>();

            const titleText = normalizeText((getField(result, 'title') || '') + " " + (getField(result, 'callTitle') || ''));
            const descriptionText = normalizeText((getField(result, 'descriptionByte') || getField(result, 'description') || ''));
            
            if (!titleText && !descriptionText) {
                return { ...result, relevanceScore: 0 };
            }

            // MEJORADO: Ranking mejorado que da más peso a keywords principales
            // y considera también keywords expandidas para matching semántico
            
            // Primero, buscar coincidencias de keywords principales (más peso)
            primaryKeywords.forEach(keyword => {
                let isMatched = false;
                if (titleText.includes(keyword)) { 
                    score += 15; // Más peso para keywords principales en título
                    isMatched = true; 
                }
                if (descriptionText.includes(keyword)) { 
                    score += 2; // Más peso para keywords principales en descripción
                    isMatched = true; 
                }
                if (isMatched) { matchedKeywords.add(keyword); }
            });
            
            // Luego, buscar coincidencias de keywords expandidas (menos peso pero útil para matching semántico)
            expandedLowerKeywords.forEach(keyword => {
                // Solo considerar si no es una keyword principal (evitar duplicados)
                if (!primaryKeywords.includes(keyword)) {
                    let isMatched = false;
                    if (titleText.includes(keyword)) { 
                        score += 5; // Menos peso para keywords expandidas en título
                        isMatched = true; 
                    }
                    if (descriptionText.includes(keyword)) { 
                        score += 1; // Menos peso para keywords expandidas en descripción
                        isMatched = true; 
                    }
                    if (isMatched) { matchedKeywords.add(keyword); }
                }
            });
    
            const matchCount = matchedKeywords.size;
            const primaryMatchCount = primaryKeywords.filter(kw => matchedKeywords.has(kw)).length;
            
            // MEJORADO: Bonus progresivo basado en porcentaje de coincidencias de keywords principales
            // Esto evita penalizar demasiado cuando hay muchas keywords y solo algunas coinciden
            if (primaryKeywords.length > 1 && primaryMatchCount > 0) {
                const matchRatio = primaryMatchCount / primaryKeywords.length;
                // Bonus máximo de 1000 si todas las keywords principales coinciden, proporcional si no
                const progressiveBonus = Math.round(matchRatio * 1000);
                score += progressiveBonus;
            }
            
            // Score base por cada keyword principal que coincida (más peso)
            score += primaryMatchCount * 150;
            
            // Bonus adicional si hay coincidencias de keywords expandidas (matching semántico)
            const expandedMatchCount = matchCount - primaryMatchCount;
            if (expandedMatchCount > 0) {
                score += expandedMatchCount * 50; // Bonus menor pero útil para matching semántico
            }
    
            return { ...result, relevanceScore: score };
        })
        // MEJORADO: Ranking más inteligente que considera keywords principales y expandidas
        .filter((result: any) => {
            // Si hay pocas keywords principales (3 o menos), ser más permisivo
            const isFewKeywords = primaryKeywords.length <= 3;
            
            if (result.relevanceScore === 0) {
                // Asignar score mínimo basado en si hay pocas o muchas keywords
                // Pero ser más conservador que antes
                result.relevanceScore = isFewKeywords ? 3 : 1;
            }
            
            // Con pocas keywords, ser más permisivo (incluir score >= 0)
            // Con muchas keywords, mantener filtro más estricto (score > 0)
            const shouldInclude = isFewKeywords 
                ? (result.relevanceScore !== undefined && result.relevanceScore >= 0)
                : (result.relevanceScore !== undefined && result.relevanceScore > 0);
            
            return shouldInclude;
        })
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
    
        return processEuropeanResults(rankedResults.slice(0, 15));
    
    } catch (error: any) { 
        console.error('[European Commission] Error general:', error);
        console.error('[European Commission] Stack:', error.stack);
        return []; 
    }
}

async function searchBOE(keywords: string[] | string, start: string, end: string): Promise<any[]> {
    try {
        // Asegurar que keywords sea un array
        const keywordsArray = Array.isArray(keywords) 
            ? keywords 
            : (typeof keywords === 'string' ? keywords.split(',').map(k => k.trim()).filter(Boolean) : []);
        
        if (keywordsArray.length === 0 || !start || !end) return [];
        const dates: string[] = [];
        for (let date = new Date(start); date <= new Date(end); date.setDate(date.getDate() + 1)) {
            dates.push(date.toISOString().slice(0, 10).replace(/-/g, ''));
        }
        const promises = dates.map(async date => {
            try {
                const API_URL = `https://boe.es/datosabiertos/api/boe/sumario/${date}`;
                const xml = await fetchWithRetry(PROXY_URL + encodeURIComponent(API_URL), { headers: { "Accept": "application/xml" } }, 3, 'text');
                if (!xml) return [];
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, "text/xml");
                return Array.from(xmlDoc.querySelectorAll('item')).map(item => ({ 
                    title: item.querySelector('titulo')?.textContent || '', 
                    urlHtml: item.querySelector('url_html')?.textContent || '#', 
                    date: date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
                }));
            } catch (e) { return []; }
        });
        const allResults = (await Promise.all(promises)).flat();
        const tenderPhrase = "anuncio de licitación de:";
        const tenders = allResults.filter((r: any) => r.title.toLowerCase().includes(tenderPhrase));
        const otherResults = allResults.filter((r: any) => !r.title.toLowerCase().includes(tenderPhrase));
        const rankedTenders = rankResults(tenders, keywordsArray, ['title'], []);
        const rankedOtherResults = rankResults(otherResults, keywordsArray, ['title'], []);
        const combinedRankedResults = [...rankedTenders, ...rankedOtherResults];
        return processBOEResults(combinedRankedResults.slice(0, 15));
    } catch (error: any) { 
        console.error('Error en BOE:', error);
        return []; 
    }
}

/**
 * Comparar múltiples subvenciones
 */
export async function compareGrants(params: CompareGrantsParams) {
    // Esta función puede usar los resultados de searchOpportunities
    // y generar una tabla comparativa
    const { grantUrls } = params;
    
    // Por ahora, retornamos un mensaje indicando que se debe usar searchOpportunities primero
    return {
        success: true,
        message: 'Usa searchOpportunities para obtener información de las subvenciones y luego compara manualmente los resultados',
        grantUrls
    };
}

