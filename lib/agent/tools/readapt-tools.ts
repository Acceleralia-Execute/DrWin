/**
 * Tools del módulo READAPT
 * Funcionalidades para adaptar propuestas existentes
 */

import { GoogleGenAI, Type } from '@google/genai';
import { AdaptProposalParams } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extraer datos de una propuesta
 */
export async function extractProposalData(params: {
    proposalFile: string; // base64
    fileType: 'pdf' | 'docx';
}) {
    try {
        const { proposalFile, fileType } = params;

        const schema = {
            type: Type.OBJECT,
            properties: {
                proposalSummary: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: 'Título completo del proyecto' },
                        budget: { type: Type.STRING, description: 'Presupuesto total extraído del documento' },
                        objectives: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Lista de los objetivos principales resumidos'
                        }
                    },
                    required: ["title", "budget", "objectives"]
                },
                evaluatorSummary: {
                    type: Type.OBJECT,
                    description: 'Resumen del feedback del evaluador (si existe)',
                    properties: {
                        evaluationResult: { type: Type.STRING, description: 'Puntuación total o resultado de la evaluación' },
                        keyScores: { type: Type.STRING, description: 'Puntuaciones parciales de criterios si existen' },
                        mainWeakness: { type: Type.STRING, description: 'La queja o debilidad más importante mencionada' }
                    },
                }
            },
            required: ["proposalSummary"]
        };

        const prompt = "Analiza los documentos adjuntos. El primer documento es la memoria de un proyecto. El segundo, si existe, es el feedback de un evaluador. Extrae la información clave y devuélvela en formato JSON, siguiendo el esquema proporcionado. Para los objetivos, extrae una lista de los objetivos principales. Si el segundo documento no existe, no incluyas el campo 'evaluatorSummary' en la respuesta.";

        const mimeType = fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        const contentParts: any[] = [
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: proposalFile,
                },
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        return {
            success: true,
            extractedData: result
        };
    } catch (error: any) {
        console.error('Error extracting proposal data:', error);
        return {
            error: `Error al extraer datos de la propuesta: ${error.message}`
        };
    }
}

/**
 * Analizar observaciones y feedback
 */
export async function analyzeObservations(params: {
    proposalFile: string; // base64
    feedbackFile?: string; // base64
    fileType: 'pdf' | 'docx';
}) {
    try {
        const { proposalFile, feedbackFile, fileType } = params;

        const schema = {
            type: Type.OBJECT,
            properties: {
                executiveSummary: { type: Type.STRING, description: 'Resumen ejecutivo del análisis' },
                strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Fortalezas del proyecto identificadas'
                },
                weaknesses: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Debilidades o áreas de mejora identificadas'
                },
                recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Recomendaciones específicas para mejorar la propuesta'
                },
                priorityActions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Acciones prioritarias a realizar'
                }
            },
            required: ["executiveSummary", "strengths", "weaknesses", "recommendations", "priorityActions"]
        };

        const prompt = `Analiza la propuesta de proyecto y el feedback del evaluador (si está disponible). Genera un informe estructurado con:
1. Resumen ejecutivo
2. Fortalezas del proyecto
3. Debilidades identificadas
4. Recomendaciones de mejora
5. Acciones prioritarias

Sé específico y proporciona recomendaciones accionables.`;

        const mimeType = fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        const contentParts: any[] = [
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: proposalFile,
                },
            }
        ];

        if (feedbackFile) {
            contentParts.push({
                inlineData: {
                    mimeType: 'application/pdf', // Asumimos PDF para feedback
                    data: feedbackFile,
                },
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        return {
            success: true,
            observationsReport: result
        };
    } catch (error: any) {
        console.error('Error analyzing observations:', error);
        return {
            error: `Error al analizar las observaciones: ${error.message}`
        };
    }
}

/**
 * Adaptar propuesta a nueva convocatoria
 */
export async function adaptProposal(params: any) {
    try {
        console.log('adaptProposal recibió parámetros:', Object.keys(params));
        
        // Aceptar parámetros con diferentes nombres
        const originalProposal = params.originalProposal || params.original_proposal || params.existingProposal || params.existing_proposal || params.proposal || params.proposalText || params.proposal_text || params.proposal_content;
        const feedbackFile = params.feedbackFile || params.feedback_file || params.feedback || params.feedbackText || params.feedback_text || params.feedback_content;
        const newCallFile = params.newCallFile || params.new_call_file || params.newCall || params.new_call;
        const newCallLink = params.newCallLink || params.new_call_link || params.newCallUrl || params.new_call_url || params.targetGrantUrl || params.target_grant_url;

        // Detectar si originalProposal es texto plano o base64
        let proposalIsText = false;
        let proposalText = '';

        if (!originalProposal || (typeof originalProposal === 'string' && originalProposal.trim() === '')) {
            console.error('No se proporcionó originalProposal');
            return { error: 'Se requiere la propuesta original' };
        }

        // Si es texto plano (no base64), lo tratamos como texto descriptivo
        // Base64 típicamente es más largo y tiene un patrón específico
        const isBase64 = typeof originalProposal === 'string' && (
            originalProposal.startsWith('data:') || 
            originalProposal.startsWith('/9j/') || // JPEG base64
            (originalProposal.length > 100 && /^[A-Za-z0-9+/=]+$/.test(originalProposal.replace(/\s/g, '')) && originalProposal.length > 500)
        );

        if (typeof originalProposal === 'string' && !isBase64) {
            proposalIsText = true;
            proposalText = originalProposal;
            console.log('Proposal detectado como texto plano, longitud:', proposalText.length);
        } else {
            console.log('Proposal detectado como base64 o archivo');
        }

        // Detectar si feedback es texto plano
        let feedbackIsText = false;
        let feedbackText = '';
        if (feedbackFile) {
            const isFeedbackBase64 = typeof feedbackFile === 'string' && (
                feedbackFile.startsWith('data:') || 
                feedbackFile.startsWith('/9j/') ||
                (feedbackFile.length > 100 && /^[A-Za-z0-9+/=]+$/.test(feedbackFile.replace(/\s/g, '')) && feedbackFile.length > 500)
            );
            
            if (typeof feedbackFile === 'string' && !isFeedbackBase64) {
                feedbackIsText = true;
                feedbackText = feedbackFile;
                console.log('Feedback detectado como texto plano, longitud:', feedbackText.length);
            }
        }

        // Si no hay nueva convocatoria pero hay feedback, permitimos continuar (reaplicación)
        // Si no hay ni nueva convocatoria ni feedback, entonces sí es un error
        if (!newCallFile && !newCallLink && !params.newCallDescription && !params.new_call_description && !params.targetGrantCriteria && !params.target_grant_criteria) {
            if (!feedbackFile && !feedbackText) {
                return { error: 'Se requiere información de la nueva convocatoria o feedback de evaluación previa' };
            }
            // Si hay feedback pero no nueva convocatoria, es una reaplicación (adaptar basándose en feedback)
            console.log('Modo reaplicación: adaptando propuesta basándose en feedback sin nueva convocatoria');
        }

        const schema = {
            type: Type.OBJECT,
            properties: {
                actionPlan: {
                    type: Type.STRING,
                    description: 'Plan de acción detallado para la adaptación de la propuesta basándose en el feedback. Debe incluir pasos específicos para abordar cada punto de rechazo.'
                },
                keyChanges: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Lista de cambios clave necesarios para corregir los problemas identificados en el feedback'
                },
                adaptedSections: {
                    type: Type.STRING,
                    description: 'Secciones adaptadas del documento en formato texto estructurado. Incluye las secciones principales mejoradas (Resumen, Objetivos, Presupuesto, etc.) con el contenido adaptado según el feedback.'
                },
                comparativeReport: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            section: { type: Type.STRING },
                            original: { type: Type.STRING },
                            adapted: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ["section", "original", "adapted", "reason"]
                    },
                    description: 'Informe comparativo mostrando cambios antes/después con razones. Debe incluir al menos 3-5 comparaciones de secciones clave.'
                }
            },
            required: ["actionPlan", "keyChanges", "adaptedSections", "comparativeReport"]
        };

        let prompt = `Actúa como un consultor experto en adaptación de propuestas de subvención.

Tu tarea es adaptar una propuesta existente basándote en el feedback de evaluación recibido.

**PROPUESTA ORIGINAL:**
${proposalIsText ? proposalText : '[Se adjunta como documento]'}

${feedbackIsText ? `**FEEDBACK DE EVALUACIÓN PREVIA:**\n${feedbackText}` : feedbackFile ? '**FEEDBACK DE EVALUACIÓN PREVIA:**\n[Se adjunta como documento]' : ''}

${newCallFile || newCallLink || params.newCallDescription ? `**NUEVA CONVOCATORIA:**\n${newCallFile ? '[Se adjunta como documento]' : newCallLink ? `Enlace: ${newCallLink}` : params.newCallDescription || params.new_call_description || params.targetGrantCriteria || params.target_grant_criteria || ''}` : ''}

Genera:
1. Un plan de acción detallado para mejorar la propuesta basándote en el feedback
2. Lista de cambios clave necesarios para corregir los problemas identificados
3. Secciones adaptadas del documento con las mejoras sugeridas
4. Informe comparativo de cambios (antes/después) mostrando qué se modificó y por qué

IMPORTANTE: 
- Analiza el feedback cuidadosamente y aborda cada punto de rechazo
- Ajusta el presupuesto si es necesario según las recomendaciones
- Elimina o modifica elementos no subvencionables mencionados en el feedback
- Proporciona secciones completas y mejoradas, no solo instrucciones`;

        const contentParts: any[] = [
            { text: prompt }
        ];

        // Solo agregar como archivo si es base64, de lo contrario ya está en el prompt
        if (!proposalIsText && originalProposal) {
            contentParts.push({
                inlineData: {
                    mimeType: 'application/pdf', // Asumimos PDF
                    data: originalProposal,
                },
            });
        }

        if (feedbackFile && !feedbackIsText) {
            contentParts.push({
                inlineData: {
                    mimeType: 'application/pdf',
                    data: feedbackFile,
                },
            });
        }

        if (newCallFile) {
            contentParts.push({
                inlineData: {
                    mimeType: 'application/pdf',
                    data: newCallFile,
                },
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        return {
            success: true,
            adaptation: result
        };
    } catch (error: any) {
        console.error('Error adapting proposal:', error);
        return {
            error: `Error al adaptar la propuesta: ${error.message}`
        };
    }
}

/**
 * Generar plan de acción para reaplicación
 */
export async function generateReapplicationPlan(params: {
    proposalFile: string; // base64
    feedbackFile: string; // base64
    fileType: 'pdf' | 'docx';
}) {
    try {
        const { proposalFile, feedbackFile, fileType } = params;

        const schema = {
            type: Type.OBJECT,
            properties: {
                analysis: { type: Type.STRING, description: 'Análisis del feedback y propuesta' },
                improvements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Mejoras específicas a implementar'
                },
                actionPlan: {
                    type: Type.STRING,
                    description: 'Plan de acción detallado para la reaplicación'
                },
                estimatedSuccessRate: {
                    type: Type.NUMBER,
                    description: 'Tasa de éxito estimada después de las mejoras (0-100)'
                }
            },
            required: ["analysis", "improvements", "actionPlan", "estimatedSuccessRate"]
        };

        const prompt = `Analiza la propuesta original y el feedback de evaluación. Genera un plan de acción para mejorar la propuesta y reaplicar a la misma convocatoria.

Proporciona:
1. Análisis del feedback
2. Mejoras específicas a implementar
3. Plan de acción detallado
4. Tasa de éxito estimada después de las mejoras`;

        const mimeType = fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        const contentParts: any[] = [
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: proposalFile,
                },
            },
            {
                inlineData: {
                    mimeType: 'application/pdf', // Asumimos PDF para feedback
                    data: feedbackFile,
                },
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        return {
            success: true,
            reapplicationPlan: result
        };
    } catch (error: any) {
        console.error('Error generating reapplication plan:', error);
        return {
            error: `Error al generar el plan de reaplicación: ${error.message}`
        };
    }
}

