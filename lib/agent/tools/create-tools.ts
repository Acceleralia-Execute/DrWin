/**
 * Tools del módulo CREATE
 * Funcionalidades para generar y redactar propuestas
 */

import { GoogleGenAI, Type } from '@google/genai';
import { GenerateConceptParams } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generar concepto de proyecto
 */
export async function generateConcept(params: any) {
    try {
        console.log('generateConcept recibió parámetros:', JSON.stringify(params, null, 2));
        
        // Aceptar parámetros con diferentes nombres
        let grantContext = params.grantContext || params.grant_context || params.call_context || params.context || params.callContext || '';
        const companyProfile = params.companyProfile || params.company_profile || {};
        const projectIdea = params.projectIdea || params.project_idea || params.idea || params.projectDescription || params.project_description || '';
        const mandatoryConditionsFile = params.mandatoryConditionsFile || params.mandatory_conditions_file || params.conditionsFile || params.conditions_file;

        // Si grantContext es un objeto, convertirlo a string
        if (typeof grantContext === 'object' && grantContext !== null) {
            // Intentar extraer información relevante del objeto
            const contextParts: string[] = [];
            if (grantContext.title) contextParts.push(`Título: ${grantContext.title}`);
            if (grantContext.description) contextParts.push(`Descripción: ${grantContext.description}`);
            if (grantContext.objectives) {
                const objectives = Array.isArray(grantContext.objectives) 
                    ? grantContext.objectives.join(', ') 
                    : grantContext.objectives;
                contextParts.push(`Objetivos: ${objectives}`);
            }
            if (grantContext.thematic_areas || grantContext.thematicAreas) {
                const areas = Array.isArray(grantContext.thematic_areas || grantContext.thematicAreas)
                    ? (grantContext.thematic_areas || grantContext.thematicAreas).join(', ')
                    : (grantContext.thematic_areas || grantContext.thematicAreas);
                contextParts.push(`Áreas temáticas: ${areas}`);
            }
            // Si no hay campos específicos, convertir todo el objeto a string
            if (contextParts.length === 0) {
                grantContext = JSON.stringify(grantContext, null, 2);
            } else {
                grantContext = contextParts.join('\n\n');
            }
        }

        // Si aún no hay grantContext, usar un contexto por defecto para pruebas
        if (!grantContext || (typeof grantContext === 'string' && grantContext.trim() === '')) {
            console.warn('No se proporcionó grantContext, usando contexto por defecto para pruebas');
            grantContext = 'Convocatoria de financiación para proyectos de innovación tecnológica. Objetivos: fomentar la investigación y desarrollo, promover la innovación, y apoyar proyectos con impacto social y tecnológico. Áreas temáticas: Tecnologías de la información, Inteligencia artificial, Robótica, Salud digital, Innovación social.';
        }

        // Validar companyProfile - si no existe, crear uno por defecto para pruebas
        let finalCompanyProfile = companyProfile;
        if (!companyProfile || typeof companyProfile !== 'object' || Object.keys(companyProfile).length === 0) {
            console.warn('No se proporcionó companyProfile completo, usando valores por defecto para pruebas');
            finalCompanyProfile = {
                name: companyProfile?.name || params.projectTitle || params.project_title || 'Organización Solicitante',
                businessSummary: companyProfile?.businessSummary || companyProfile?.business_summary || params.projectDescription || params.project_description || 'Organización dedicada a la innovación tecnológica',
                sector: companyProfile?.sector || 'Tecnología e Innovación'
            };
        } else {
            // Asegurar que tiene las propiedades mínimas
            finalCompanyProfile = {
                name: companyProfile.name || params.projectTitle || params.project_title || 'Organización Solicitante',
                businessSummary: companyProfile.businessSummary || companyProfile.business_summary || 'Organización dedicada a la innovación tecnológica',
                sector: companyProfile.sector || 'Tecnología e Innovación'
            };
        }

        console.log('grantContext procesado:', grantContext.substring(0, 200) + '...');
        console.log('finalCompanyProfile:', finalCompanyProfile);

        const fullSchema = {
            type: Type.OBJECT,
            properties: {
                idea: {
                    type: Type.STRING,
                    description: 'Idea principal del proyecto en 2-3 párrafos'
                },
                specificObjectives: {
                    type: Type.STRING,
                    description: 'Objetivos específicos del proyecto'
                },
                mandatoryConditions: {
                    type: Type.STRING,
                    description: 'Condiciones obligatorias o prerrequisitos clave extraídos del documento'
                },
                potentialPartners: {
                    type: Type.STRING,
                    description: 'Perfiles de socios potenciales necesarios para el consorcio'
                },
                workPackages: {
                    type: Type.ARRAY,
                    description: 'Una lista detallada de al menos 6 paquetes de trabajo (WPs)',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: 'Título del WP (ej: "WP1: Gestión y Coordinación")' },
                            objective: { type: Type.STRING, description: 'Objetivos y tareas principales del WP' },
                            leader: { type: Type.STRING, description: 'Organización líder del WP' },
                            startMonth: { type: Type.STRING, description: 'Mes de inicio (ej: "M1")' },
                            endMonth: { type: Type.STRING, description: 'Mes de finalización (ej: "M12")' },
                        },
                        required: ['title', 'objective', 'leader', 'startMonth', 'endMonth']
                    }
                }
            },
            required: ['idea', 'specificObjectives', 'mandatoryConditions', 'potentialPartners', 'workPackages']
        };

        const textPrompt = `Actúa como un consultor experto en subvenciones. A partir del siguiente perfil de empresa cliente, la información de la convocatoria y el documento de condiciones (anexo), genera una propuesta de proyecto innovadora.

Contexto del proyecto y convocatoria: "${grantContext}"

Perfil de la empresa:
- Nombre: ${finalCompanyProfile.name || 'No especificado'}
- Resumen del negocio: ${finalCompanyProfile.businessSummary || finalCompanyProfile.business_summary || 'No especificado'}
- Sector: ${finalCompanyProfile.sector || 'No especificado'}

${projectIdea ? `Idea del proyecto proporcionada: ${projectIdea}` : ''}

Tu tarea es generar:
1. Una idea de proyecto innovadora
2. Objetivos específicos claros y medibles
3. Condiciones obligatorias extraídas del documento (si está disponible)
4. Perfiles de socios potenciales necesarios
5. Una lista detallada de al menos 6 paquetes de trabajo

**INSTRUCCIÓN CRÍTICA PARA 'mandatoryConditions'**: Extrae las condiciones obligatorias o prerrequisitos clave EXCLUSIVAMENTE del contenido del documento PDF "Anexo de Condiciones" que se adjunta. Resume los 2-3 puntos más importantes. Si el archivo no está disponible o no es legible, indica que las condiciones deben ser revisadas manualmente en el documento oficial.

Para los paquetes de trabajo, asigna un líder lógico (el cliente o un socio) y define un cronograma de inicio y fin (ej: "M1", "M6") coherente con la duración total del proyecto.`;

        const contentParts: any[] = [{ text: textPrompt }];
        
        if (mandatoryConditionsFile) {
            contentParts.push({
                inlineData: {
                    mimeType: 'application/pdf',
                    data: mandatoryConditionsFile,
                },
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: contentParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: fullSchema,
            },
        });

        const jsonStr = response.text.trim();
        const generatedData = JSON.parse(jsonStr);

        // Validar que tenemos los datos necesarios
        if (!generatedData.idea || !generatedData.specificObjectives) {
            return {
                error: 'La respuesta del modelo no contiene todos los campos requeridos',
                received: Object.keys(generatedData)
            };
        }

        // Validar workPackages
        if (!generatedData.workPackages || !Array.isArray(generatedData.workPackages)) {
            return {
                error: 'La respuesta no incluye paquetes de trabajo válidos',
                received: generatedData
            };
        }

        return {
            success: true,
            concept: {
                idea: generatedData.idea,
                specificObjectives: generatedData.specificObjectives,
                mandatoryConditions: generatedData.mandatoryConditions || 'No se pudieron extraer condiciones del documento',
                potentialPartners: generatedData.potentialPartners || 'No se especificaron socios potenciales',
                workPackages: generatedData.workPackages.map((wp: any, index: number) => {
                    // Validar que cada WP tenga los campos necesarios
                    if (!wp.title || !wp.objective || !wp.leader) {
                        console.warn(`WP ${index} incompleto:`, wp);
                    }
                    return {
                        id: `wp_${Date.now()}_${index}`,
                        title: wp.title || `WP${index + 1}`,
                        description: wp.objective || wp.description || 'Sin descripción',
                        leader: wp.leader || finalCompanyProfile.name || 'No especificado',
                        startMonth: wp.startMonth || `M${index + 1}`,
                        endMonth: wp.endMonth || `M${index + 6}`,
                    };
                })
            }
        };
    } catch (error: any) {
        console.error('Error generating concept:', error);
        const receivedParams = {
            grantContext: params.grantContext || params.grant_context || params.context,
            companyProfile: params.companyProfile || params.company_profile,
            hasProjectIdea: !!(params.projectIdea || params.project_idea || params.idea)
        };
        console.error('Parámetros recibidos:', receivedParams);
        return {
            error: `Error al generar el concepto: ${error.message}`,
            details: error.stack
        };
    }
}

/**
 * Generar contenido de publicación (acrónimo, idea corta, abstract)
 */
export async function generatePublicationContent(params: {
    projectContext: string;
    concept: {
        idea: string;
        specificObjectives: string;
        workPackages: any[];
    };
    partners?: Array<{ name: string; role: string; country: string }>;
}) {
    try {
        const { projectContext, concept, partners = [] } = params;

        const schema = {
            type: Type.OBJECT,
            properties: {
                acronym: { type: Type.STRING, description: 'Acrónimo del proyecto (máximo 10 caracteres)' },
                shortIdea: { type: Type.STRING, description: 'Idea corta del proyecto (1-2 frases)' },
                abstract: { type: Type.STRING, description: 'Abstract detallado del proyecto (3-4 párrafos)' },
            },
            required: ['acronym', 'shortIdea', 'abstract']
        };

        const context = `
            INFORMACIÓN DE LA CONVOCATORIA:
            ${projectContext}

            NOTA CONCEPTUAL DEL PROYECTO:
            - Idea Principal: ${concept.idea}
            - Objetivos Específicos: ${concept.specificObjectives}

            PAQUETES DE TRABAJO (WPs):
            ${concept.workPackages.map((wp, index) => `
            - WP${index + 1}: ${wp.title}
              - Descripción/Objetivo: ${wp.description}
            `).join('')}

            ${partners.length > 0 ? `SOCIOS DEL CONSORCIO:\n${partners.map(p => `- ${p.name} (Rol: ${p.role}, País: ${p.country})`).join('\n')}` : ''}
        `;

        const prompt = `A partir de la siguiente información detallada sobre una propuesta de subvención, crea un informe de proyecto profesional y bien estructurado en español. Tu tarea es generar únicamente los siguientes tres elementos: un acrónimo, una idea corta y un abstract.

Contexto del Proyecto:
${context}

Por favor, genera una respuesta JSON con los campos "acronym", "shortIdea" y "abstract" basados en el contexto proporcionado. El "abstract" debe ser detallado (3-4 párrafos) y convincente.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const generatedData = JSON.parse(jsonStr);

        return {
            success: true,
            publication: {
                acronym: generatedData.acronym,
                shortIdea: generatedData.shortIdea,
                abstract: generatedData.abstract,
            }
        };
    } catch (error: any) {
        console.error('Error generating publication content:', error);
        return {
            error: `Error al generar el contenido de publicación: ${error.message}`
        };
    }
}

/**
 * Redactar sección específica de una propuesta
 */
export async function draftProposalSection(params: {
    section: string;
    context: string;
    grantRequirements: string;
    existingContent?: string;
}) {
    try {
        const { section, context, grantRequirements, existingContent } = params;

        const prompt = `Actúa como un redactor experto de propuestas de subvención.

Tu tarea es redactar la sección "${section}" de una propuesta de subvención.

**CONTEXTO DEL PROYECTO:**
${context}

**REQUISITOS DE LA CONVOCATORIA:**
${grantRequirements}

${existingContent ? `**CONTENIDO EXISTENTE (puedes mejorarlo o reescribirlo):**\n${existingContent}` : ''}

Genera un texto profesional, técnico y convincente que se ajuste a los requisitos de la convocatoria. El texto debe ser claro, estructurado y destacar el valor del proyecto.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return {
            success: true,
            content: response.text,
            section
        };
    } catch (error: any) {
        console.error('Error drafting proposal section:', error);
        return {
            error: `Error al redactar la sección: ${error.message}`
        };
    }
}

/**
 * Revisar y mejorar una propuesta
 */
export async function reviewProposal(params: {
    proposalText: string;
    grantCriteria: string;
    focusAreas?: string[];
}) {
    try {
        const { proposalText, grantCriteria, focusAreas = [] } = params;

        const schema = {
            type: Type.OBJECT,
            properties: {
                overallAssessment: { type: Type.STRING, description: 'Evaluación general de la propuesta' },
                strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Puntos fuertes identificados'
                },
                weaknesses: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Puntos débiles o áreas de mejora'
                },
                inconsistencies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Incoherencias detectadas'
                },
                suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Sugerencias específicas de mejora'
                },
                improvedSections: {
                    type: Type.OBJECT,
                    description: 'Secciones mejoradas (opcional)',
                    additionalProperties: { type: Type.STRING }
                }
            },
            required: ["overallAssessment", "strengths", "weaknesses", "inconsistencies", "suggestions"]
        };

        const prompt = `Actúa como un revisor experto de propuestas de subvención.

Revisa la siguiente propuesta y proporciona un análisis detallado:

**PROPUESTA:**
${proposalText}

**CRITERIOS DE LA CONVOCATORIA:**
${grantCriteria}

${focusAreas.length > 0 ? `**ÁREAS DE ENFOQUE ESPECÍFICAS:**\n${focusAreas.join('\n')}` : ''}

Analiza la propuesta y proporciona:
1. Evaluación general
2. Puntos fuertes
3. Puntos débiles
4. Incoherencias detectadas
5. Sugerencias de mejora
6. (Opcional) Secciones mejoradas si es necesario`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        return {
            success: true,
            review: result
        };
    } catch (error: any) {
        console.error('Error reviewing proposal:', error);
        return {
            error: `Error al revisar la propuesta: ${error.message}`
        };
    }
}

