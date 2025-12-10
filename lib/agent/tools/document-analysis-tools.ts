/**
 * Tools para análisis avanzado de documentos
 * Extracción de entidades, resúmenes, comparación
 */

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
                    text: "Extrae todo el texto de este documento y devuélvelo como texto plano, preservando la estructura, párrafos y formato básico. Si hay tablas, conviértelas a formato de texto legible. Si hay listas, mantenlas como listas."
                },
                {
                    inlineData: {
                        mimeType,
                        data: fileData,
                    }
                }
            ],
            config: {
                maxOutputTokens: 8000, // Permitir documentos largos
            },
        });
        
        return response.text.trim();
    } catch (error: any) {
        console.error('Error extracting text from file:', error);
        throw new Error(`Error al extraer texto del archivo: ${error.message}`);
    }
}

/**
 * Extraer entidades de un documento (organizaciones, fechas, montos, etc.)
 */
export async function extractEntities(params: {
    documentText?: string;
    documentFile?: string; // Base64 del archivo PDF o DOCX
    fileType?: 'pdf' | 'docx';
    documentType?: 'convocatoria' | 'propuesta' | 'informe' | 'general';
}) {
    try {
        let { documentText, documentFile, fileType, documentType = 'general' } = params;
        
        // Si no hay texto pero hay archivo, extraer el texto primero
        if (!documentText && documentFile && fileType) {
            documentText = await extractTextFromFile(documentFile, fileType);
        }
        
        if (!documentText) {
            return {
                error: 'Se requiere documentText o documentFile con fileType para extraer entidades'
            };
        }

        const schema = {
            type: Type.OBJECT,
            properties: {
                organizations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Organizaciones mencionadas en el documento'
                },
                dates: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Fechas importantes (deadlines, fechas de inicio, etc.)'
                },
                amounts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Montos o presupuestos mencionados'
                },
                keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Palabras clave y términos importantes'
                },
                requirements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Requisitos o condiciones mencionadas'
                },
                objectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Objetivos o metas mencionadas'
                }
            },
            required: ['organizations', 'dates', 'amounts', 'keywords']
        };

        const prompt = `Analiza el siguiente documento de tipo "${documentType}" y extrae las entidades importantes.

DOCUMENTO:
${documentText}

Extrae:
1. Organizaciones mencionadas
2. Fechas importantes (deadlines, fechas límite, etc.)
3. Montos o presupuestos
4. Palabras clave y términos técnicos
5. Requisitos o condiciones
6. Objetivos o metas

Proporciona la información en formato JSON estructurado.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const extractedData = JSON.parse(jsonStr);

        return {
            success: true,
            entities: extractedData
        };
    } catch (error: any) {
        console.error('Error extracting entities:', error);
        return {
            error: `Error al extraer entidades: ${error.message}`
        };
    }
}

/**
 * Generar resumen ejecutivo de un documento largo
 */
export async function generateSummary(params: {
    documentText?: string;
    documentFile?: string; // Base64 del archivo PDF o DOCX
    fileType?: 'pdf' | 'docx';
    maxLength?: number;
    focusAreas?: string[];
}) {
    try {
        let { documentText, documentFile, fileType, maxLength = 500, focusAreas = [] } = params;
        
        // Si no hay texto pero hay archivo, extraer el texto primero
        if (!documentText && documentFile && fileType) {
            documentText = await extractTextFromFile(documentFile, fileType);
        }
        
        if (!documentText) {
            return {
                error: 'Se requiere documentText o documentFile con fileType para generar el resumen'
            };
        }

        const prompt = `Genera un resumen ejecutivo del siguiente documento.

DOCUMENTO:
${documentText}

${focusAreas.length > 0 ? `ENFOQUE ESPECÍFICO EN: ${focusAreas.join(', ')}` : ''}

El resumen debe:
- Ser conciso (máximo ${maxLength} palabras)
- Incluir los puntos más importantes
- Mantener el contexto y significado original
- Estar estructurado en párrafos cortos

Resumen:`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                maxOutputTokens: Math.max(500, maxLength * 2),
            },
        });

        return {
            success: true,
            summary: response.text.trim(),
            wordCount: response.text.trim().split(/\s+/).length
        };
    } catch (error: any) {
        console.error('Error generating summary:', error);
        return {
            error: `Error al generar resumen: ${error.message}`
        };
    }
}

/**
 * Comparar múltiples documentos lado a lado
 */
export async function compareDocuments(params: {
    documents: Array<{ 
        name: string; 
        content?: string; // Texto del documento
        file?: string; // Base64 del archivo PDF o DOCX
        fileType?: 'pdf' | 'docx'; // Tipo de archivo si se proporciona file
    }>;
    comparisonCriteria?: string[];
}) {
    try {
        const { documents, comparisonCriteria = [] } = params;

        if (documents.length < 2) {
            return {
                error: 'Se necesitan al menos 2 documentos para comparar'
            };
        }
        
        // Extraer texto de documentos que tienen archivos
        const processedDocuments = await Promise.all(
            documents.map(async (doc) => {
                let content = doc.content;
                
                // Si no hay contenido pero hay archivo, extraerlo
                if (!content && doc.file && doc.fileType) {
                    content = await extractTextFromFile(doc.file, doc.fileType);
                }
                
                if (!content) {
                    throw new Error(`Documento "${doc.name}" no tiene contenido ni archivo válido`);
                }
                
                return {
                    name: doc.name,
                    content
                };
            })
        );

        const schema = {
            type: Type.OBJECT,
            properties: {
                similarities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Puntos en común entre los documentos'
                },
                differences: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Diferencias principales entre los documentos'
                },
                recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Recomendaciones basadas en la comparación'
                },
                comparisonTable: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            aspect: { type: Type.STRING },
                            document1: { type: Type.STRING },
                            document2: { type: Type.STRING },
                        }
                    },
                    description: 'Tabla comparativa de aspectos clave'
                }
            },
            required: ['similarities', 'differences', 'recommendations']
        };

        const documentsText = processedDocuments.map((doc, idx) => 
            `DOCUMENTO ${idx + 1} (${doc.name}):\n${doc.content}\n\n`
        ).join('---\n\n');

        const criteriaText = comparisonCriteria.length > 0 
            ? `CRITERIOS DE COMPARACIÓN: ${comparisonCriteria.join(', ')}\n\n`
            : '';

        const prompt = `Compara los siguientes documentos y proporciona un análisis detallado.

${criteriaText}${documentsText}

Analiza:
1. Similitudes entre los documentos
2. Diferencias principales
3. Recomendaciones basadas en la comparación
4. Tabla comparativa de aspectos clave

Proporciona la información en formato JSON estructurado.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const comparison = JSON.parse(jsonStr);

        return {
            success: true,
            comparison
        };
    } catch (error: any) {
        console.error('Error comparing documents:', error);
        return {
            error: `Error al comparar documentos: ${error.message}`
        };
    }
}

/**
 * Analizar estructura y calidad de un documento
 */
export async function analyzeDocumentStructure(params: {
    documentText?: string;
    documentFile?: string; // Base64 del archivo PDF o DOCX
    fileType?: 'pdf' | 'docx';
    documentType: 'convocatoria' | 'propuesta' | 'informe';
}) {
    try {
        let { documentText, documentFile, fileType, documentType } = params;
        
        // Si no hay texto pero hay archivo, extraer el texto primero
        if (!documentText && documentFile && fileType) {
            documentText = await extractTextFromFile(documentFile, fileType);
        }
        
        if (!documentText) {
            return {
                error: 'Se requiere documentText o documentFile con fileType para analizar la estructura'
            };
        }

        const schema = {
            type: Type.OBJECT,
            properties: {
                structure: {
                    type: Type.OBJECT,
                    properties: {
                        hasIntroduction: { type: Type.BOOLEAN },
                        hasObjectives: { type: Type.BOOLEAN },
                        hasMethodology: { type: Type.BOOLEAN },
                        hasBudget: { type: Type.BOOLEAN },
                        hasTimeline: { type: Type.BOOLEAN },
                        hasConclusion: { type: Type.BOOLEAN },
                    }
                },
                quality: {
                    type: Type.OBJECT,
                    properties: {
                        completeness: { type: Type.STRING, description: 'Nivel de completitud (Alto/Medio/Bajo)' },
                        clarity: { type: Type.STRING, description: 'Nivel de claridad (Alto/Medio/Bajo)' },
                        coherence: { type: Type.STRING, description: 'Nivel de coherencia (Alto/Medio/Bajo)' },
                    }
                },
                suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Sugerencias de mejora'
                },
                missingElements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Elementos que faltan según el tipo de documento'
                }
            },
            required: ['structure', 'quality', 'suggestions']
        };

        const prompt = `Analiza la estructura y calidad del siguiente documento de tipo "${documentType}".

DOCUMENTO:
${documentText}

Evalúa:
1. Estructura del documento (qué secciones tiene)
2. Calidad (completitud, claridad, coherencia)
3. Sugerencias de mejora
4. Elementos que faltan según el tipo de documento

Proporciona la información en formato JSON estructurado.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const analysis = JSON.parse(jsonStr);

        return {
            success: true,
            analysis
        };
    } catch (error: any) {
        console.error('Error analyzing document structure:', error);
        return {
            error: `Error al analizar estructura: ${error.message}`
        };
    }
}

