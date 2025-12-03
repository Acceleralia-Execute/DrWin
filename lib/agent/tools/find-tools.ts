/**
 * Tools del módulo FIND
 * Funcionalidades para buscar oportunidades de financiación
 */

import { SearchOpportunitiesParams, ValidateGrantParams, CompareGrantsParams } from '../types';

const PROXY_URL = 'https://corsproxy.io/?';
const globalCache = new Map();

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
 * Traducir keywords del español al inglés para búsquedas en European Commission API
 * La API busca en documentos en inglés, por lo que necesitamos traducir las keywords
 */
function translateKeywordsToEnglish(keywords: string[]): string[] {
    // Diccionario de traducciones comunes español -> inglés
    const translationMap: Record<string, string> = {
        // Términos de tecnología
        'blockchain': 'blockchain',
        'tecnología financiera': 'financial technology',
        'fintech': 'financial technology',
        'innovación tecnológica': 'technological innovation',
        'innovación': 'innovation',
        'tecnología': 'technology',
        'digitalización': 'digitalization',
        'transformación digital': 'digital transformation',
        'inteligencia artificial': 'artificial intelligence',
        'ia': 'artificial intelligence',
        'aprendizaje automático': 'machine learning',
        'aprendizaje profundo': 'deep learning',
        'big data': 'big data',
        'ciencia de datos': 'data science',
        'análisis de datos': 'data analytics',
        
        // Términos de sostenibilidad
        'sostenibilidad': 'sustainability',
        'cambio climático': 'climate change',
        'energía renovable': 'renewable energy',
        'energías renovables': 'renewable energy',
        'economía circular': 'circular economy',
        'tecnología verde': 'green technology',
        'medio ambiente': 'environment',
        'medioambiental': 'environmental',
        'eficiencia energética': 'energy efficiency',
        
        // Términos generales
        'investigación y desarrollo': 'research and development',
        'i+d': 'research and development',
        'i+d+i': 'research and development innovation',
        'desarrollo': 'development',
        'investigación': 'research',
        'proyecto': 'project',
        'proyectos': 'projects',
        
        // Términos de financiación
        'subvención': 'grant',
        'subvenciones': 'grants',
        'financiación': 'funding',
        'ayuda': 'aid',
        'convocatoria': 'call',
        'convocatorias': 'calls',
    };
    
    // Detectar si hay palabras en español (con acentos o palabras conocidas)
    const spanishIndicators = /[ñáéíóúüÑÁÉÍÓÚÜ]|tecnología|innovación|financiera|nacional|internacional|sostenibilidad|energía/i;
    const hasSpanish = keywords.some(kw => 
        spanishIndicators.test(kw) ||
        Object.keys(translationMap).some(spanishTerm => 
            kw.toLowerCase().includes(spanishTerm.toLowerCase())
        )
    );
    
    if (!hasSpanish) {
        // No parece haber español, devolver keywords originales
        return keywords;
    }
    
    // Traducir keywords
    return keywords.map(kw => {
        const lower = kw.toLowerCase().trim();
        
        // Buscar traducción exacta primero
        if (translationMap[lower]) {
            return translationMap[lower];
        }
        
        // Buscar si contiene alguna palabra del diccionario y reemplazar
        let translated = kw;
        let wasTranslated = false;
        
        // Ordenar por longitud descendente para reemplazar frases completas primero
        const sortedEntries = Object.entries(translationMap).sort((a, b) => b[0].length - a[0].length);
        
        for (const [spanish, english] of sortedEntries) {
            const regex = new RegExp(`\\b${spanish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            if (regex.test(lower)) {
                translated = translated.replace(regex, english);
                wasTranslated = true;
            }
        }
        
        // Si se tradujo algo, devolver la traducción; si no, dejar original
        return wasTranslated ? translated : kw;
    });
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

        // Validar que keywords no esté vacío
        if (!keywords || keywords.length === 0) {
            return { error: 'Se requieren palabras clave para la búsqueda' };
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

        // DEBUG: Log de los tipos de financiación normalizados
        console.log('[searchOpportunities] Funding types normalizados:', normalizedFundingTypes);
        console.log('[searchOpportunities] Solo internacionales solicitado:', onlyInternationalRequested);

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
        
        // MEJORADO: Traducir keywords del español al inglés para la API de European Commission
        // La API busca en documentos en inglés, por lo que necesitamos keywords en inglés
        const originalKeywords = [...keywordsArray];
        keywordsArray = translateKeywordsToEnglish(keywordsArray);
        
        if (JSON.stringify(originalKeywords) !== JSON.stringify(keywordsArray)) {
            console.log(`[European Commission] Keywords traducidas:`, {
                originales: originalKeywords,
                traducidas: keywordsArray
            });
        }
        
        const API_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?";
        
        let allResults: any[] = [];
        let pageNumber = 1;
        const pageSize = 50;
        const maxPages = 30;
        let hasMoreResults = true;
        
        const getField = (result: any, fieldName: string) => result[fieldName] || result.metadata?.[fieldName]?.[0];

        // Construct a broad search query (no quotes) to ensure results
        const searchText = keywordsArray.join(' ');

        console.log(`[European Commission] Buscando con keywords: ${searchText}`);

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
            
            console.log(`[European Commission] Página ${pageNumber}, URL: ${API_URL}`);
            
            try {
                const response = await fetchWithRetry(API_URL, { method: "POST", body: formData }, 3, 'json', cacheKey);
                
                // DEBUG: Log la respuesta para diagnosticar
                console.log(`[European Commission] Respuesta página ${pageNumber}:`, {
                    hasResults: !!response.results,
                    resultsLength: response.results?.length || 0,
                    responseKeys: Object.keys(response || {}),
                    sampleResult: response.results?.[0] || null
                });
                
                if (response && response.results && Array.isArray(response.results) && response.results.length > 0) {
                    allResults = [...allResults, ...response.results];
                    console.log(`[European Commission] Página ${pageNumber}: ${response.results.length} resultados, total acumulado: ${allResults.length}`);
                    
                    if (response.results.length < pageSize) {
                        hasMoreResults = false;
                    } else {
                        pageNumber++;
                    }
                } else {
                    // Si no hay resultados, log para entender por qué
                    if (response && !response.results) {
                        console.warn(`[European Commission] Respuesta sin campo 'results':`, response);
                    } else if (response && response.results && response.results.length === 0) {
                        console.log(`[European Commission] Página ${pageNumber}: 0 resultados`);
                    }
                    hasMoreResults = false;
                }
            } catch (fetchError: any) {
                console.error(`[European Commission] Error en página ${pageNumber}:`, fetchError.message);
                hasMoreResults = false;
            }
        }

        console.log(`[European Commission] Total resultados encontrados: ${allResults.length}`);

        const uniqueResults = [...new Map(allResults.map(item => [getField(item, 'identifier'), item])).values()];
        console.log(`[European Commission] Resultados únicos después de deduplicar: ${uniqueResults.length}`);
        
        // Normalizar palabras clave: convertir a minúsculas y normalizar acentos
        const normalizeText = (text: string) => {
            return text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
        };
        
        // Para el ranking, usar las keywords originales Y traducidas para mejor matching
        const keywordsForRanking = [...new Set([...originalKeywords, ...keywordsArray])];
        const lowerKeywords = keywordsForRanking.map(k => normalizeText(k));
        
        // DEBUG: Log las palabras clave normalizadas
        console.log(`[European Commission] Palabras clave para ranking:`, lowerKeywords);
        
        const rankedResults = uniqueResults.map((result: any) => {
            let score = 0;
            const matchedKeywords = new Set<string>();

            const titleText = normalizeText((getField(result, 'title') || '') + " " + (getField(result, 'callTitle') || ''));
            const descriptionText = normalizeText((getField(result, 'descriptionByte') || getField(result, 'description') || ''));
            
            // DEBUG: Log el primer resultado para ver qué contiene
            if (uniqueResults.indexOf(result) === 0) {
                console.log(`[European Commission] DEBUG Primer resultado:`, {
                    title: getField(result, 'title'),
                    callTitle: getField(result, 'callTitle'),
                    titleText: titleText.substring(0, 200),
                    descriptionText: descriptionText.substring(0, 200),
                    hasDescription: !!descriptionText
                });
            }
            
            if (!titleText && !descriptionText) {
                console.log(`[European Commission] Resultado sin título ni descripción, score: 0`);
                return { ...result, relevanceScore: 0 };
            }

            lowerKeywords.forEach(keyword => {
                let isMatched = false;
                // Buscar coincidencia (ya todo está normalizado a minúsculas sin acentos)
                if (titleText.includes(keyword)) { 
                    score += 10; 
                    isMatched = true; 
                    if (uniqueResults.indexOf(result) === 0) {
                        console.log(`[European Commission] Match en título: "${keyword}"`);
                    }
                }
                if (descriptionText.includes(keyword)) { 
                    score += 1; 
                    isMatched = true; 
                    if (uniqueResults.indexOf(result) === 0) {
                        console.log(`[European Commission] Match en descripción: "${keyword}"`);
                    }
                }
                if (isMatched) { matchedKeywords.add(keyword); }
            });
    
            const matchCount = matchedKeywords.size;
            
            // MEJORADO: Bonus progresivo basado en porcentaje de coincidencias
            // Esto evita penalizar demasiado cuando hay muchas keywords y solo algunas coinciden
            if (keywordsArray.length > 1 && matchCount > 0) {
                const matchRatio = matchCount / keywordsArray.length;
                // Bonus máximo de 1000 si todas coinciden, proporcional si no
                const progressiveBonus = Math.round(matchRatio * 1000);
                score += progressiveBonus;
                
                if (matchCount === keywordsArray.length && uniqueResults.indexOf(result) === 0) {
                    console.log(`[European Commission] Bonus: todas las palabras coinciden (+${progressiveBonus})`);
                } else if (uniqueResults.indexOf(result) === 0) {
                    console.log(`[European Commission] Bonus progresivo: ${matchCount}/${keywordsArray.length} palabras coinciden (+${progressiveBonus})`);
                }
            }
            
            // Score base por cada keyword que coincida
            score += matchCount * 100;
            
            // DEBUG: Log el score final del primer resultado
            if (uniqueResults.indexOf(result) === 0) {
                console.log(`[European Commission] DEBUG Score final:`, {
                    matchCount,
                    totalKeywords: keywordsArray.length,
                    matchedKeywords: Array.from(matchedKeywords),
                    finalScore: score
                });
            }
    
            return { ...result, relevanceScore: score };
        })
        // MODIFICADO: Ranking más flexible, especialmente cuando hay pocas keywords
        // Si la API devolvió resultados, confiar más en su filtrado
        .filter((result: any) => {
            // Si hay pocas keywords (3 o menos), ser más permisivo
            // porque es más probable que el resultado sea relevante aunque no coincida exactamente
            const isFewKeywords = keywordsArray.length <= 3;
            
            if (result.relevanceScore === 0) {
                // Asignar score mínimo basado en si hay pocas o muchas keywords
                result.relevanceScore = isFewKeywords ? 5 : 1; // Score más alto si hay pocas keywords
                if (uniqueResults.indexOf(result) === 0) {
                    console.log(`[European Commission] Resultado con score 0, asignando score mínimo de ${result.relevanceScore} (pocas keywords: ${isFewKeywords})`);
                }
            }
            
            // Con pocas keywords, ser más permisivo (incluir score >= 0)
            // Con muchas keywords, mantener filtro más estricto (score > 0)
            const shouldInclude = isFewKeywords 
                ? (result.relevanceScore !== undefined && result.relevanceScore >= 0)
                : (result.relevanceScore !== undefined && result.relevanceScore > 0);
            
            if (!shouldInclude && uniqueResults.indexOf(result) === 0) {
                console.log(`[European Commission] Resultado filtrado: score=${result.relevanceScore}, pocas keywords=${isFewKeywords}`);
            }
            
            return shouldInclude;
        })
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
    
        console.log(`[European Commission] Resultados finales después de ranking: ${rankedResults.length}`);
        if (rankedResults.length > 0) {
            console.log(`[European Commission] Primer resultado rankeado:`, {
                title: rankedResults[0].title || getField(rankedResults[0], 'title'),
                score: rankedResults[0].relevanceScore
            });
        }
    
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

