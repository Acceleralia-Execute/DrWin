/**
 * Sistema de agente principal con function calling
 */

import { GoogleGenAI } from '@google/genai';
import { MASTER_PROMPT } from './prompts/master-prompt';
import { AgentMessage, AgentContext } from './types';

// Importar tools
import * as findTools from './tools/find-tools';
import * as validateTools from './tools/validate-tools';
import * as createTools from './tools/create-tools';
import * as readaptTools from './tools/readapt-tools';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Definir las funciones disponibles para el agente
const TOOLS = [
    {
        name: 'searchOpportunities',
        description: 'Buscar oportunidades de financiación (subvenciones nacionales, internacionales, licitaciones) basándose en palabras clave y filtros. IMPORTANTE: Si el usuario solicita "solo internacionales" o "solo europeas", establecer nationalSubsidies: false y internationalSubsidies: true. Si solicita "solo nacionales", establecer nationalSubsidies: true e internationalSubsidies: false.',
        parameters: {
            type: 'object',
            properties: {
                keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Palabras clave para la búsqueda'
                },
                fundingTypes: {
                    type: 'object',
                    properties: {
                        nationalSubsidies: { 
                            type: 'boolean',
                            description: 'Buscar en subvenciones nacionales. Si el usuario solicita solo internacionales, debe ser false.'
                        },
                        internationalSubsidies: { 
                            type: 'boolean',
                            description: 'Buscar en subvenciones internacionales/europeas. Si el usuario solicita solo nacionales, debe ser false.'
                        },
                        nationalTenders: { type: 'boolean' },
                        internationalTenders: { type: 'boolean' }
                    },
                    description: 'Tipos de financiación a buscar. Si el usuario especifica explícitamente solo un tipo, los otros deben ser false.'
                },
                startDate: { type: 'string', description: 'Fecha de inicio en formato YYYY-MM-DD' },
                endDate: { type: 'string', description: 'Fecha de fin en formato YYYY-MM-DD' },
                language: { type: 'string', enum: ['es', 'ca', 'en', 'fr', 'de', 'it'] }
            },
            required: ['keywords']
        }
    },
    {
        name: 'validateGrant',
        description: 'Validar elegibilidad y compatibilidad de un proyecto con una convocatoria específica. Evalúa criterios y proporciona puntuación. REQUIERE la URL de la convocatoria (grantUrl). IMPORTANTE: Si el usuario ha mencionado su proyecto anteriormente en la conversación, DEBES extraer esa información del historial y pasarla en projectDetails o projectContext para que la validación sea precisa. Puedes obtener la URL de los resultados de searchOpportunities.',
        parameters: {
            type: 'object',
            properties: {
                grantUrl: { type: 'string', description: 'URL completa de la convocatoria (obligatorio). Ejemplo: https://www.infosubvenciones.es/bdnstrans/GE/es/convocatorias/808821' },
                projectContext: { type: 'string', description: 'Descripción completa del proyecto como texto plano. Úsalo si no tienes projectDetails estructurado. Extrae esta información del historial de conversación si el usuario mencionó su proyecto anteriormente.' },
                companyProfile: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        businessSummary: { type: 'string' },
                        sector: { type: 'string' },
                        services: { type: 'array', items: { type: 'string' } },
                        keywords: { type: 'array', items: { type: 'string' } }
                    },
                    description: 'Perfil de la empresa. Extrae esta información del historial si está disponible.'
                },
                projectDetails: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Título del proyecto. Extrae del historial si el usuario lo mencionó.' },
                        description: { type: 'string', description: 'Descripción detallada del proyecto. CRÍTICO: Extrae del historial si está disponible.' },
                        objectives: { type: 'array', items: { type: 'string' }, description: 'Objetivos del proyecto. Extrae del historial si están disponibles.' }
                    },
                    description: 'Detalles del proyecto a validar. CRÍTICO: Si el usuario mencionó su proyecto anteriormente, DEBES extraer esta información del historial de conversación y pasarla aquí.'
                }
            },
            required: ['grantUrl']
        }
    },
    {
        name: 'simulateEvaluation',
        description: 'Simular la evaluación de una propuesta según los criterios de una convocatoria. Proporciona puntuación estimada y recomendaciones',
        parameters: {
            type: 'object',
            properties: {
                proposalText: { type: 'string', description: 'Texto de la propuesta a evaluar' },
                grantCriteria: { type: 'string', description: 'Criterios de la convocatoria' },
                evaluationCriteria: { type: 'array', items: { type: 'string' } }
            },
            required: ['proposalText', 'grantCriteria']
        }
    },
    {
        name: 'generateConcept',
        description: 'Generar concepto de proyecto completo incluyendo idea, objetivos, socios potenciales y paquetes de trabajo. USA ESTA HERRAMIENTA cuando el usuario confirme que está listo para generar el concepto (ej: "sí estoy listo", "adelante", "procede"). Extrae información del historial de conversación: título del proyecto, descripción, objetivos, y contexto de la convocatoria si se validó anteriormente. Acepta grantContext como string o objeto. Si falta información, usa valores por defecto razonables basados en el contexto disponible.',
        parameters: {
            type: 'object',
            properties: {
                grantContext: { 
                    type: 'string', 
                    description: 'Contexto de la convocatoria (puede ser texto descriptivo o un objeto JSON con title, description, objectives, etc.)' 
                },
                call_context: { 
                    type: 'string', 
                    description: 'Alternativa a grantContext: contexto de la convocatoria' 
                },
                companyProfile: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Nombre de la organización' },
                        businessSummary: { type: 'string', description: 'Resumen del negocio o actividad' },
                        sector: { type: 'string', description: 'Sector de actividad' }
                    }
                },
                company_profile: {
                    type: 'object',
                    description: 'Alternativa a companyProfile'
                },
                projectIdea: { 
                    type: 'string', 
                    description: 'Idea o descripción del proyecto (opcional)' 
                },
                projectTitle: {
                    type: 'string',
                    description: 'Título del proyecto (opcional, se usa si falta companyProfile.name)'
                },
                projectDescription: {
                    type: 'string',
                    description: 'Descripción del proyecto (opcional, se usa si falta información)'
                },
                mandatoryConditionsFile: { 
                    type: 'string', 
                    description: 'Base64 del PDF de condiciones (opcional)' 
                }
            },
            required: []
        }
    },
    {
        name: 'generatePublicationContent',
        description: 'Generar contenido de publicación: acrónimo, idea corta y abstract del proyecto',
        parameters: {
            type: 'object',
            properties: {
                projectContext: { type: 'string' },
                concept: {
                    type: 'object',
                    properties: {
                        idea: { type: 'string' },
                        specificObjectives: { type: 'string' },
                        workPackages: { type: 'array' }
                    }
                },
                partners: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            role: { type: 'string' },
                            country: { type: 'string' }
                        }
                    }
                }
            },
            required: ['projectContext', 'concept']
        }
    },
    {
        name: 'draftProposalSection',
        description: 'Redactar una sección específica de una propuesta (ej: objetivos, metodología, impacto)',
        parameters: {
            type: 'object',
            properties: {
                section: { type: 'string', description: 'Nombre de la sección a redactar' },
                context: { type: 'string', description: 'Contexto del proyecto' },
                grantRequirements: { type: 'string', description: 'Requisitos de la convocatoria' },
                existingContent: { type: 'string', description: 'Contenido existente (opcional)' }
            },
            required: ['section', 'context', 'grantRequirements']
        }
    },
    {
        name: 'reviewProposal',
        description: 'Revisar una propuesta completa, detectar incoherencias y sugerir mejoras',
        parameters: {
            type: 'object',
            properties: {
                proposalText: { type: 'string' },
                grantCriteria: { type: 'string' },
                focusAreas: { type: 'array', items: { type: 'string' } }
            },
            required: ['proposalText', 'grantCriteria']
        }
    },
    {
        name: 'extractProposalData',
        description: 'Extraer datos clave de una propuesta existente (título, presupuesto, objetivos)',
        parameters: {
            type: 'object',
            properties: {
                proposalFile: { type: 'string', description: 'Base64 del archivo PDF o DOCX' },
                fileType: { type: 'string', enum: ['pdf', 'docx'] }
            },
            required: ['proposalFile', 'fileType']
        }
    },
    {
        name: 'analyzeObservations',
        description: 'Analizar observaciones y feedback de una evaluación previa',
        parameters: {
            type: 'object',
            properties: {
                proposalFile: { type: 'string', description: 'Base64 del archivo de propuesta' },
                feedbackFile: { type: 'string', description: 'Base64 del archivo de feedback (opcional)' },
                fileType: { type: 'string', enum: ['pdf', 'docx'] }
            },
            required: ['proposalFile', 'fileType']
        }
    },
    {
        name: 'adaptProposal',
        description: 'Adaptar una propuesta existente a una nueva convocatoria o mejorar basándose en feedback. Acepta propuesta y feedback como texto plano o base64. Si falta nueva convocatoria, se adapta basándose solo en el feedback.',
        parameters: {
            type: 'object',
            properties: {
                originalProposal: { 
                    type: 'string', 
                    description: 'Propuesta original (puede ser texto plano o base64 del archivo). También acepta: existingProposal, proposal, proposalText' 
                },
                existingProposal: {
                    type: 'string',
                    description: 'Alternativa a originalProposal: propuesta existente como texto o base64'
                },
                feedback: {
                    type: 'string',
                    description: 'Feedback de evaluación (puede ser texto plano o base64). También acepta: feedbackFile, feedbackText'
                },
                feedbackFile: { 
                    type: 'string', 
                    description: 'Base64 del archivo de feedback (opcional). También acepta feedback como texto' 
                },
                feedbackText: {
                    type: 'string',
                    description: 'Feedback como texto plano (alternativa a feedbackFile)'
                },
                newCallFile: { 
                    type: 'string', 
                    description: 'Base64 del archivo de nueva convocatoria (opcional)' 
                },
                newCallLink: { 
                    type: 'string', 
                    description: 'URL de la nueva convocatoria (opcional)' 
                },
                newCallDescription: {
                    type: 'string',
                    description: 'Descripción de la nueva convocatoria como texto (opcional)'
                }
            },
            required: []
        }
    },
    {
        name: 'generateReapplicationPlan',
        description: 'Generar plan de acción para reaplicar a la misma convocatoria mejorando la propuesta',
        parameters: {
            type: 'object',
            properties: {
                proposalFile: { type: 'string', description: 'Base64 del archivo de propuesta' },
                feedbackFile: { type: 'string', description: 'Base64 del archivo de feedback' },
                fileType: { type: 'string', enum: ['pdf', 'docx'] }
            },
            required: ['proposalFile', 'feedbackFile', 'fileType']
        }
    },
    {
        name: 'compareGrants',
        description: 'Comparar múltiples subvenciones y generar tabla comparativa',
        parameters: {
            type: 'object',
            properties: {
                grantUrls: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'URLs de las convocatorias a comparar'
                },
                criteria: { type: 'array', items: { type: 'string' } }
            },
            required: ['grantUrls']
        }
    }
];

// Mapeo de herramientas a MiniWins (agentes especializados)
const TOOL_TO_MINIWIN: Record<string, { name: string; module: string }> = {
    searchOpportunities: { name: 'Explora', module: 'Find' },
    compareGrants: { name: 'Explora', module: 'Find' },
    validateGrant: { name: 'Ponder', module: 'Validate' },
    simulateEvaluation: { name: 'Ponder', module: 'Validate' },
    generateConcept: { name: 'Inventa', module: 'Create' },
    generatePublicationContent: { name: 'Inventa', module: 'Create' },
    draftProposalSection: { name: 'Inventa', module: 'Create' },
    reviewProposal: { name: 'Inventa', module: 'Create' },
    extractProposalData: { name: 'Transcripto', module: 'Readapt' },
    analyzeObservations: { name: 'Transcripto', module: 'Readapt' },
    adaptProposal: { name: 'Transcripto', module: 'Readapt' },
    generateReapplicationPlan: { name: 'Transcripto', module: 'Readapt' },
};

// Mapeo de nombres de funciones a implementaciones
const TOOL_IMPLEMENTATIONS: Record<string, Function> = {
    searchOpportunities: findTools.searchOpportunities,
    validateGrant: validateTools.validateGrant,
    simulateEvaluation: validateTools.simulateEvaluation,
    generateConcept: createTools.generateConcept,
    generatePublicationContent: createTools.generatePublicationContent,
    draftProposalSection: createTools.draftProposalSection,
    reviewProposal: createTools.reviewProposal,
    extractProposalData: readaptTools.extractProposalData,
    analyzeObservations: readaptTools.analyzeObservations,
    adaptProposal: readaptTools.adaptProposal,
    generateReapplicationPlan: readaptTools.generateReapplicationPlan,
    compareGrants: findTools.compareGrants,
};

/**
 * Formatear comparativeReport como tabla markdown
 */
function formatComparativeReportAsTable(comparativeReport: Array<{
    section: string;
    original: string;
    adapted: string;
    reason: string;
}>): string {
    if (!comparativeReport || comparativeReport.length === 0) {
        return '';
    }

    // Función para formatear celdas: escapar caracteres especiales y truncar
    const formatCell = (text: string, maxLength: number = 200): string => {
        if (!text || text.trim() === '') return '-';
        
        // Limpiar el texto: eliminar saltos de línea múltiples y espacios extra
        let formatted = text.trim()
            .replace(/\n+/g, ' ')  // Reemplazar saltos de línea con espacios
            .replace(/\s+/g, ' ')  // Normalizar espacios múltiples
            .replace(/\|/g, '\\|')  // Escapar pipes
            .replace(/\r/g, '');    // Eliminar retornos de carro
        
        // Truncar si es muy largo
        if (formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength - 3) + '...';
        }
        
        return formatted || '-';
    };

    let table = '\n\n| Sección | Original | Adaptada | Razón del Cambio |\n';
    table += '|---------|----------|----------|------------------|\n';

    comparativeReport.forEach(item => {
        const section = formatCell(item.section || '-', 50);
        const original = formatCell(item.original || '-', 200);
        const adapted = formatCell(item.adapted || '-', 200);
        const reason = formatCell(item.reason || '-', 150);
        table += `| ${section} | ${original} | ${adapted} | ${reason} |\n`;
    });

    return table;
}

/**
 * Formatear resultados de validateGrant con puntajes al principio
 */
function formatValidateGrantResults(result: any): string {
    if (!result || !result.success || !result.analysis) {
        return JSON.stringify(result, null, 2);
    }

    const analysis = result.analysis;
    const overallScore = analysis.overallScore || 0;
    
    // Asegurar que el score esté en escala 0-100 (convertir si viene en escala 0-10)
    const normalizedOverallScore = overallScore > 10 ? overallScore : overallScore * 10;
    
    let formatted = `\n\n## Puntuaciones de Validación\n\n`;
    formatted += `**Puntuación General:** ${normalizedOverallScore.toFixed(1)}/100\n\n`;
    
    if (analysis.criteria && Array.isArray(analysis.criteria)) {
        formatted += `**Desglose por Criterios:**\n`;
        analysis.criteria.forEach((criterion: any) => {
            // Normalizar score a escala 0-100
            const criterionScore = criterion.score > 10 ? criterion.score : criterion.score * 10;
            formatted += `- ${criterion.criterion}: ${criterionScore.toFixed(1)}/100 (Peso: ${criterion.weight}%)\n`;
        });
    }
    
    formatted += `\n---\n\n`;
    
    // El resto del contenido (summary y analysis) se agregará después por el agente
    formatted += `**NOTA PARA EL AGENTE:** Los puntajes ya están mostrados arriba. Ahora presenta el resumen de la convocatoria y el análisis detallado a continuación.\n\n`;
    
    return formatted;
}

/**
 * Formatear resultados de searchOpportunities con URLs incluidas
 */
function formatSearchOpportunitiesResults(result: any): string {
    if (!result || !result.success || !result.results || result.results.length === 0) {
        return JSON.stringify(result, null, 2);
    }

    const formatCell = (text: string, maxLength: number = 100): string => {
        if (!text || text.trim() === '') return '-';
        let formatted = text.trim()
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/\|/g, '\\|')
            .replace(/\r/g, '');
        if (formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength - 3) + '...';
        }
        return formatted || '-';
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString || dateString === 'No disponible' || dateString === 'No disponible en API' || dateString === 'No disponible en sumario') {
            return 'No disponible';
        }
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    let formatted = `\n\n## Resultados de Búsqueda (${result.count} encontradas)\n\n`;
    formatted += `**Resumen:**\n`;
    formatted += `- Subvenciones nacionales: ${result.summary?.nationalGrants || 0}\n`;
    formatted += `- Subvenciones internacionales: ${result.summary?.internationalGrants || 0}\n`;
    formatted += `- Licitaciones nacionales: ${result.summary?.nationalTenders || 0}\n\n`;

    formatted += `| Título | Fuente | Fecha Publicación | Fecha Límite | Presupuesto | URL |\n`;
    formatted += `|--------|--------|------------------|--------------|-------------|-----|\n`;

    result.results.forEach((item: any) => {
        const title = formatCell(item.title || 'Sin título', 60);
        const source = formatCell(item.source || '-', 20);
        const pubDate = formatDate(item.publication_date);
        const deadline = formatDate(item.deadline_date);
        const budget = formatCell(item.budget || 'No disponible', 30);
        const url = item.url && item.url !== '#' ? `[Ver convocatoria](${item.url})` : '-';
        
        formatted += `| ${title} | ${source} | ${pubDate} | ${deadline} | ${budget} | ${url} |\n`;
    });

    formatted += `\n\n**IMPORTANTE:** Cada resultado incluye un enlace (URL) en la última columna. DEBES mencionar y mostrar estas URLs en tu respuesta al usuario para que puedan acceder directamente a las convocatorias.\n`;

    return formatted;
}

/**
 * Ejecutar una función tool
 */
async function executeTool(name: string, args: any): Promise<any> {
    const tool = TOOL_IMPLEMENTATIONS[name];
    if (!tool) {
        console.error(`Tool ${name} no encontrado. Tools disponibles:`, Object.keys(TOOL_IMPLEMENTATIONS));
        return { error: `Tool ${name} no encontrado. Tools disponibles: ${Object.keys(TOOL_IMPLEMENTATIONS).join(', ')}` };
    }
    
    const miniWin = TOOL_TO_MINIWIN[name];
    
    try {
        const result = await tool(args);
        
        // Agregar información del MiniWin al resultado
        if (miniWin && result && !result.error) {
            result._miniWin = miniWin;
        }
        
        return result;
    } catch (error: any) {
        console.error(`Error ejecutando tool ${name}:`, error);
        console.error('Stack trace:', error.stack);
        return { 
            error: `Error ejecutando ${name}: ${error.message}`,
            details: error.stack
        };
    }
}

/**
 * Procesar mensaje del usuario y generar respuesta usando el agente
 */
export async function processMessage(
    userMessage: string,
    attachments: Array<{ name: string; type: string; data: string }> = [],
    conversationHistory: AgentMessage[] = [],
    onToolCallsDetected?: (toolCalls: Array<{ tool: string; miniWin?: { name: string; module: string } }>) => void
): Promise<{ response: string; toolCalls?: any[] }> {
    try {
        // Construir historial de conversación para el prompt
        const historyText = conversationHistory
            .slice(-10) // Últimos 10 mensajes para no exceder tokens
            .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
            .join('\n\n');

        // Preparar partes del mensaje actual
        const parts: any[] = [{ text: userMessage }];
        
        // Agregar attachments si existen
        attachments.forEach(att => {
            if (att.type.startsWith('image/')) {
                parts.push({
                    inlineData: {
                        mimeType: att.type,
                        data: att.data,
                    }
                });
            } else if (att.type === 'application/pdf' || att.type.includes('wordprocessingml')) {
                // Para PDFs y DOCX, los agregamos como texto en el prompt
                parts.push({
                    inlineData: {
                        mimeType: att.type,
                        data: att.data,
                    }
                });
            }
        });

        // Crear prompt con información de herramientas disponibles
        const toolsDescription = TOOLS.map(tool => 
            `- ${tool.name}: ${tool.description}`
        ).join('\n');

        const enhancedPrompt = `${MASTER_PROMPT}

## Herramientas Disponibles

Tienes acceso a las siguientes herramientas. Cuando el usuario necesite realizar una acción, debes decidir qué herramienta usar y proporcionar los parámetros necesarios en formato JSON. Luego ejecutaré la herramienta y te daré el resultado.

${toolsDescription}

## Instrucciones para usar herramientas

Cuando necesites usar una herramienta, DEBES responder EXACTAMENTE en el siguiente formato (es crítico que uses este formato exacto):

\`\`\`tool
{
  "tool": "nombre_de_la_herramienta",
  "params": { ... parámetros ... }
}
\`\`\`

IMPORTANTE:
- El nombre de la herramienta debe ser EXACTAMENTE uno de los nombres listados arriba
- Los parámetros deben ser un objeto JSON válido
- Si falta información para algún parámetro, usa valores por defecto razonables o pregunta al usuario
- Después de ejecutar la herramienta, recibirás el resultado y deberás explicarlo al usuario de forma clara y estructurada usando markdown

**ESPECIALMENTE PARA generateConcept:**
- Cuando el usuario confirme que está listo (dice "sí estoy listo", "estoy listo", "adelante", "procede", "ok", "sí", "si", "de acuerdo", "perfecto", "vamos", etc.), DEBES llamar INMEDIATAMENTE a generateConcept
- NO solo digas que vas a comunicarte con Inventa - DEBES incluir el bloque de código \`\`\`tool con la llamada real
- Extrae la información del historial de conversación (título del proyecto, descripción, contexto de convocatoria) y pásala en los parámetros
- Ejemplo cuando el usuario dice "sí estoy listo":
\`\`\`tool
{
  "tool": "generateConcept",
  "params": {
    "grantContext": "información de la convocatoria del historial",
    "projectTitle": "título del proyecto del historial",
    "projectDescription": "descripción del proyecto del historial"
  }
}
\`\`\`

${historyText ? `\n## Historial de Conversación\n${historyText}\n` : ''}

## Mensaje del Usuario
${userMessage}`;

        // Llamar al modelo
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction: enhancedPrompt,
            },
        });

        const responseText = response.text;

        // Buscar si hay llamadas a herramientas en la respuesta
        // Intentar múltiples formatos
        const toolCalls: any[] = [];
        
        // Formato 1: ```tool { ... } ```
        const toolCallRegex1 = /```tool\s*\n?({[\s\S]*?})\s*\n?```/g;
        let match;
        while ((match = toolCallRegex1.exec(responseText)) !== null) {
            try {
                const toolCall = JSON.parse(match[1]);
                if (toolCall.tool && toolCall.params) {
                    toolCalls.push(toolCall);
                }
            } catch (e) {
                console.error('Error parsing tool call (format 1):', e);
            }
        }

        // Formato 2: ```json { "tool": "...", "params": {...} } ```
        if (toolCalls.length === 0) {
            const toolCallRegex2 = /```json\s*\n?({[\s\S]*?"tool"[\s\S]*?})\s*\n?```/g;
            while ((match = toolCallRegex2.exec(responseText)) !== null) {
                try {
                    const toolCall = JSON.parse(match[1]);
                    if (toolCall.tool && toolCall.params) {
                        toolCalls.push(toolCall);
                    }
                } catch (e) {
                    console.error('Error parsing tool call (format 2):', e);
                }
            }
        }

        // Formato 3: Buscar JSON inline sin code blocks
        if (toolCalls.length === 0) {
            const toolCallRegex3 = /\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"params"\s*:\s*(\{[\s\S]*?\})\s*\}/g;
            while ((match = toolCallRegex3.exec(responseText)) !== null) {
                try {
                    const toolName = match[1];
                    const paramsStr = match[2];
                    const params = JSON.parse(paramsStr);
                    toolCalls.push({ tool: toolName, params });
                } catch (e) {
                    console.error('Error parsing tool call (format 3):', e);
                }
            }
        }

        // Formato 4: Buscar por nombre de herramienta seguido de parámetros
        if (toolCalls.length === 0) {
            for (const tool of TOOLS) {
                const toolNameRegex = new RegExp(`(?:usar|ejecutar|llamar|comunicar|generar|crear)\\s+(?:la\\s+)?(?:herramienta\\s+)?(?:con\\s+)?${tool.name}`, 'i');
                if (toolNameRegex.test(responseText)) {
                    // Intentar extraer parámetros del contexto
                    const paramsMatch = responseText.match(/\{[\s\S]*?\}/);
                    if (paramsMatch) {
                        try {
                            const params = JSON.parse(paramsMatch[0]);
                            toolCalls.push({ tool: tool.name, params });
                        } catch (e) {
                            // Si no es JSON válido, crear parámetros básicos
                            toolCalls.push({ tool: tool.name, params: {} });
                        }
                    } else {
                        toolCalls.push({ tool: tool.name, params: {} });
                    }
                    break;
                }
            }
        }

        // Formato 5: Buscar menciones específicas de Inventa/Create cuando el usuario confirma
        if (toolCalls.length === 0) {
            const inventaMentions = /(?:comunicar|hablar|contactar|llamar).*?(?:con|a).*?Inventa|Inventa.*?(?:para|a|de).*?(?:generar|crear|trabajar)|generar.*?concepto|crear.*?concepto|concepto.*?proyecto/i;
            if (inventaMentions.test(responseText) && responseText.toLowerCase().includes('generateConcept') === false) {
                // Si menciona Inventa pero no hay tool call, intentar crear uno
                const paramsMatch = responseText.match(/\{[\s\S]*?\}/);
                let params = {};
                if (paramsMatch) {
                    try {
                        params = JSON.parse(paramsMatch[0]);
                    } catch (e) {
                        // Si no es JSON válido, crear parámetros básicos vacíos
                        params = {};
                    }
                }
                toolCalls.push({ tool: 'generateConcept', params });
            }
        }

        // Si hay tool calls, notificar antes de ejecutarlos
        if (toolCalls.length > 0 && onToolCallsDetected) {
            const toolCallsInfo = toolCalls.map(tc => ({
                tool: tc.tool,
                miniWin: TOOL_TO_MINIWIN[tc.tool]
            }));
            onToolCallsDetected(toolCallsInfo);
        }

        // Si hay tool calls, ejecutarlos
        if (toolCalls.length > 0) {
            const toolResults = await Promise.all(
                toolCalls.map(async (tc) => {
                    const result = await executeTool(tc.tool, tc.params);
                    return { tool: tc.tool, result };
                })
            );

            // Generar respuesta final con los resultados
            // Si hay un comparativeReport, formatearlo como tabla markdown directamente
            let formattedTable = '';
            let searchOpportunitiesFormatted = '';
            let validateGrantFormatted = '';
            const miniWinMessages: string[] = [];
            const resultsText = toolResults.map(tr => {
                const result = tr.result;
                const miniWin = TOOL_TO_MINIWIN[tr.tool];
                
                // Agregar mensaje del MiniWin
                if (miniWin) {
                    miniWinMessages.push(`He hablado con ${miniWin.name} de ${miniWin.module} y estos fueron sus resultados:`);
                }
                
                // Si es adaptProposal y tiene comparativeReport, formatearlo
                if (tr.tool === 'adaptProposal' && result?.success && result?.adaptation?.comparativeReport) {
                    formattedTable = formatComparativeReportAsTable(result.adaptation.comparativeReport);
                }
                
                // Si es searchOpportunities, formatearlo con URLs
                if (tr.tool === 'searchOpportunities' && result?.success) {
                    searchOpportunitiesFormatted = formatSearchOpportunitiesResults(result);
                    return `${miniWin ? `**Comunicación con ${miniWin.name} de ${miniWin.module}:**\n\n` : ''}Resultado de ${tr.tool}:${searchOpportunitiesFormatted}`;
                }
                
                // Si es validateGrant, formatearlo con puntajes al principio
                if (tr.tool === 'validateGrant' && result?.success) {
                    validateGrantFormatted = formatValidateGrantResults(result);
                    // Incluir también los datos completos para que el agente pueda usarlos
                    return `${miniWin ? `**Comunicación con ${miniWin.name} de ${miniWin.module}:**\n\n` : ''}Resultado de ${tr.tool}:${validateGrantFormatted}\n\nDatos completos de validación:\n${JSON.stringify(result, null, 2)}`;
                }
                
                return `${miniWin ? `**Comunicación con ${miniWin.name} de ${miniWin.module}:**\n\n` : ''}Resultado de ${tr.tool}:\n${JSON.stringify(result, null, 2)}`;
            }).join('\n\n');

            const tableSection = formattedTable ? `

## Tabla Comparativa Pre-formateada

A continuación tienes la tabla comparativa ya formateada en markdown. DEBES incluirla exactamente así en tu respuesta:

${formattedTable}

` : '';

            const searchOpportunitiesSection = searchOpportunitiesFormatted ? `

## Resultados de Búsqueda Pre-formateados

A continuación tienes los resultados de búsqueda ya formateados en markdown con las URLs incluidas. DEBES incluir esta tabla exactamente así en tu respuesta, asegurándote de que las URLs sean clicables:

${searchOpportunitiesFormatted}

` : '';

            const validateGrantSection = validateGrantFormatted ? `

## Resultados de Validación Pre-formateados

A continuación tienes los resultados de validación ya formateados con los PUNTAJES AL PRINCIPIO. DEBES incluir esta sección de puntajes EXACTAMENTE así al inicio de tu respuesta, antes de cualquier otra explicación:

${validateGrantFormatted}

IMPORTANTE: Los puntajes DEBEN aparecer al principio del mensaje, antes del resumen y análisis detallado.

` : '';

            const miniWinIntro = miniWinMessages.length > 0 
                ? `\n\n## Comunicación con MiniWins\n\n${miniWinMessages.join('\n\n')}\n\n` 
                : '';

            const finalPrompt = `${responseText}

## Resultados de las Herramientas

${miniWinIntro}${resultsText}
${tableSection}
${searchOpportunitiesSection}
${validateGrantSection}

Ahora explica estos resultados al usuario de forma clara y estructurada usando markdown. ${miniWinMessages.length > 0 ? 'Menciona que te comunicaste con los MiniWins correspondientes (Explora, Ponder, Inventa, Transcripto, etc.) para obtener estos resultados. ' : ''}Si hay errores, explícalos. Si hay datos, preséntalos de forma organizada.

${formattedTable ? 'IMPORTANTE: Incluye la tabla comparativa pre-formateada que aparece arriba en tu respuesta final, en la sección correspondiente del informe comparativo.' : ''}
${searchOpportunitiesFormatted ? 'IMPORTANTE: Incluye la tabla de resultados de búsqueda pre-formateada que aparece arriba en tu respuesta final. Asegúrate de que todas las URLs sean clicables y visibles para el usuario.' : ''}
${validateGrantFormatted ? 'IMPORTANTE: Los puntajes de validación DEBEN aparecer al PRINCIPIO de tu respuesta, antes de cualquier otra explicación. Usa el formato pre-formateado que aparece arriba.' : ''}`;

            const finalResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: finalPrompt,
                config: {
                    systemInstruction: MASTER_PROMPT,
                },
            });

            return {
                response: finalResponse.text,
                toolCalls: toolCalls.map(tc => ({ name: tc.tool, args: tc.params }))
            };
        }

        // Si no hay tool calls, retornar respuesta directa
        return {
            response: responseText
        };
    } catch (error: any) {
        console.error('Error processing message:', error);
        return {
            response: `Lo siento, ocurrió un error: ${error.message}. Por favor, intenta de nuevo.`
        };
    }
}

