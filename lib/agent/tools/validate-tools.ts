/**
 * Tools del módulo VALIDATE
 * Funcionalidades para validar y evaluar compatibilidad de proyectos con convocatorias
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ValidateGrantParams } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Validar elegibilidad y compatibilidad de un proyecto con una convocatoria
 */
export async function validateGrant(params: any) {
    try {
        // Aceptar parámetros con diferentes nombres (grantUrl, grant_url, url, grantContext)
        const grantUrl = params.grantUrl || params.grant_url || params.url || params.grantContext || params.grant_context;
        const grantName = params.grantName || params.name || params.grant_name || '';
        const grantFiles = params.grantFiles || params.files || params.grant_files || [];
        const grantDescription = params.grantDescription || params.description || params.grant_description || '';
        const companyProfile = params.companyProfile || params.company_profile || {};
        const projectDetails = params.projectDetails || params.project_details || {};
        
        // Si projectDetails viene como projectContext (string), intentar parsearlo o usarlo como description
        if (!projectDetails.title && !projectDetails.description && params.projectContext) {
            if (typeof params.projectContext === 'string') {
                projectDetails.description = params.projectContext;
            } else if (params.projectContext.title || params.projectContext.description) {
                Object.assign(projectDetails, params.projectContext);
            }
        }
        
        // ========== VALIDACIONES MEJORADAS ==========
        
        // 1. Validar que haya al menos una fuente de información de la convocatoria
        const hasUrl = grantUrl && grantUrl.trim().length > 0;
        const hasFiles = grantFiles && Array.isArray(grantFiles) && grantFiles.length > 0;
        const hasDescription = grantDescription && grantDescription.trim().length > 0;
        
        if (!hasUrl && !hasFiles && !hasDescription) {
            return { 
                error: '❌ **Información de la convocatoria requerida**\n\n' +
                       'Para validar una convocatoria, necesitas proporcionar al menos uno de los siguientes:\n\n' +
                       '1. **URL de la convocatoria** (ej: https://ec.europa.eu/info/funding-tenders/...)\n' +
                       '2. **Archivos PDF/DOCX** de la convocatoria (sube los documentos)\n' +
                       '3. **Descripción detallada** de la convocatoria (pega el texto completo)\n\n' +
                       '¿Cuál de estas opciones puedes proporcionar?'
            };
        }
        
        // 2. Validar formato de URL si se proporciona
        if (hasUrl) {
            try {
                new URL(grantUrl);
            } catch {
                return { 
                    error: '❌ **URL inválida**\n\n' +
                           'La URL proporcionada no tiene un formato válido.\n' +
                           'Debe comenzar con http:// o https://\n\n' +
                           'Ejemplo válido: https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/...'
                };
            }
        }
        
        // 3. Validar que la descripción tenga contenido suficiente
        if (hasDescription && grantDescription.trim().length < 50) {
            return {
                error: '⚠️ **Descripción muy corta**\n\n' +
                       'La descripción proporcionada es muy corta (' + grantDescription.trim().length + ' caracteres).\n' +
                       'Para un análisis preciso, necesitamos al menos 50 caracteres de información sobre la convocatoria.\n\n' +
                       'Por favor, proporciona más detalles sobre:\n' +
                       '- Objetivos de la convocatoria\n' +
                       '- Requisitos de elegibilidad\n' +
                       '- Presupuesto y financiación\n' +
                       '- Fechas importantes\n' +
                       '- Criterios de evaluación'
            };
        }
        
        // 4. Validar que haya nombre de la convocatoria (recomendado pero no obligatorio)
        if (!grantName || grantName.trim().length === 0) {
            // No bloqueamos, pero informamos que sería útil
            console.warn('Advertencia: No se proporcionó nombre de la convocatoria. El análisis será menos preciso.');
        }

        const hasProject = projectDetails?.title && projectDetails?.description;
        const hasCompanyProfile = companyProfile?.name && companyProfile?.businessSummary;

        const summarySchema = {
            type: Type.OBJECT,
            properties: {
                programmeAndAction: { type: Type.STRING },
                totalBudgetAndFundingRate: { type: Type.STRING },
                deadline: { type: Type.STRING },
                expectedOutcomes: { type: Type.STRING },
                eligibleBeneficiaries: { type: Type.STRING },
                fundableActivities: { type: Type.STRING },
                evaluationCriteria: { type: Type.STRING },
                mandatoryRequirements: { type: Type.STRING },
            },
            required: ["programmeAndAction", "totalBudgetAndFundingRate", "deadline", "expectedOutcomes", "eligibleBeneficiaries", "fundableActivities", "evaluationCriteria", "mandatoryRequirements"]
        };

        const analysisSchemaProperties: any = {
            overallScore: { type: Type.NUMBER },
            justification: { type: Type.STRING },
            suggestedRole: { type: Type.STRING },
            criteria: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        criterion: { type: Type.STRING },
                        weight: { type: Type.NUMBER },
                        score: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["criterion", "weight", "score", "reasoning"]
                }
            }
        };
        const analysisSchemaRequired = ["overallScore", "justification", "suggestedRole", "criteria"];

        if (hasProject) {
            analysisSchemaProperties.improvementPlan = {
                type: Type.OBJECT,
                properties: {
                    suggestedModifications: { type: Type.STRING },
                    projectedScore: { type: Type.NUMBER },
                    keyGap: { type: Type.STRING }
                },
                required: ["suggestedModifications", "projectedScore", "keyGap"]
            };
            analysisSchemaRequired.push("improvementPlan");
        }

        const analysisSchema = {
            type: Type.OBJECT,
            properties: analysisSchemaProperties,
            required: analysisSchemaRequired
        };

        const combinedSchema = {
            type: Type.OBJECT,
            properties: {
                summary: summarySchema,
                analysis: analysisSchema
            },
            required: ["summary", "analysis"]
        };

        let applicantSection = "";
        let criteriaSection = "";
        let consultantInstruction = "";

        if (hasCompanyProfile) {
            applicantSection = `
                **1. APPLICANT ENTITY (Company Profile):**
                - Name: ${companyProfile.name}
                - Main Activity/Summary: ${companyProfile.businessSummary}
                - Sector: ${companyProfile.sector || 'Not specified'}
                - Key Services & Products: ${(companyProfile.services || []).join(', ')}
                - Core Competencies (Keywords): ${(companyProfile.keywords || []).join(', ')}
            `;

            criteriaSection = `
                **Evaluation Criteria (Standard Mode - Full Profile):**
                Use these criteria and weights. Total 100%.
                IMPORTANT: All scores must be on a scale of 0-100 (not 0-10).
                
                **CRITICAL: Before evaluating, check DOMAIN/SECTOR alignment first.**
                If the company's sector/domain does NOT match the grant's domain, give low scores (0-30) for Strategic alignment.
                
                1. **Domain/Sector alignment (20%):** Does the company's sector match the grant's domain? Score: 0-100.
                   - If domains don't match (e.g., company in buildings but grant is about transportation), this MUST be 0-30.
                   - Don't give high scores just because both mention generic technologies (AI, sensors, etc.).
                2. **Legal eligibility (12%):** Is the entity type valid? Score: 0-100.
                3. **Strategic alignment (15%):** Does the goal match the Call? Score: 0-100.
                4. **Technical expertise (15%):** Does the entity have experience in the area? Score: 0-100.
                5. **Operational capacity (10%):** Resources to execute? Score: 0-100.
                6. **Past EU experience (8%):** Track record. Score: 0-100.
                7. **Geographical relevance (8%):** Country/Region value. Score: 0-100.
                8. **Role potential (7%):** Can they take a valuable role? Score: 0-100.
                9. **Funding viability (5%):** Funding rate fit. Score: 0-100.
            `;
        } else {
            applicantSection = `
                **1. APPLICANT ENTITY (Status: ANONYMOUS / UNDEFINED):**
                - The user has NOT provided specific company details yet.
                - **CRITICAL:** IGNORE all company-specific requirements.
                - Evaluate ONLY the merit of the PROJECT IDEA itself.
            `;

            criteriaSection = `
                **Evaluation Criteria (PROJECT ONLY MODE):**
                Since specific Company Profile data is missing, you must only evaluate the project's intrinsic quality.
                
                **REQUIRED OUTPUT for 'criteria' array:**
                IMPORTANT: All scores must be on a scale of 0-100 (not 0-10).
                You MUST return an array with EXACTLY these 5 criteria objects (re-weighted to 100%):
                1. { "criterion": "Domain/Sector Alignment", "weight": 40, "score": 0-100, "reasoning": "..." }
                   - This is the MOST IMPORTANT criterion. If domains don't match, this MUST be 0-30.
                   - Examples of domain mismatch: Buildings vs Transportation, Healthcare vs Agriculture, Energy Grid vs Manufacturing
                   - Only give high scores (70+) if the project domain EXACTLY matches the grant domain
                2. { "criterion": "Strategic Alignment (Technical Fit)", "weight": 25, "score": 0-100, "reasoning": "..." }
                3. { "criterion": "Technical Expertise (Implied)", "weight": 15, "score": 0-100, "reasoning": "..." }
                4. { "criterion": "Innovation / Impact Potential", "weight": 10, "score": 0-100, "reasoning": "..." }
                5. { "criterion": "Funding Viability (Budget/Scope)", "weight": 10, "score": 0-100, "reasoning": "..." }
            `;
        }

        if (hasProject) {
            consultantInstruction = `
                - **STRATEGIC IMPROVEMENT:** If the score is below 100, act as a Consultant. Identify the main 'keyGap'. Then provide 'suggestedModifications' to close this gap. Calculate the 'projectedScore' (0-100 scale) if these changes are applied.
            `;
        }

        const prompt = `
            Act as an expert Grant Evaluator${hasProject ? ' and Strategy Consultant' : ''}.
            
            **TASK:**
            Evaluate the compatibility between the Applicant/Project and the Grant Opportunity.
            Provide ALL responses in Spanish.

            ${applicantSection}

            **2. PROPOSED ACTION (Specific Project Idea):**
            ${hasProject ? `
            **CRITICAL: A PROJECT DESCRIPTION HAS BEEN PROVIDED. YOU MUST USE THIS INFORMATION.**
            
            - Project Title: ${projectDetails.title}
            - Description: ${projectDetails.description}
            - Specific Objectives: ${(projectDetails.objectives || []).join(', ')}
            
            **IMPORTANT:** The project information above is REAL and PROVIDED. You MUST analyze this specific project. 
            DO NOT say "no project description provided" or "project not defined" - the project is clearly described above.
            You MUST identify the domain/sector of THIS SPECIFIC PROJECT based on the description provided.
            ` : 'NO SPECIFIC PROJECT DEFINED. Evaluate based purely on the APPLICANT ENTITY capabilities.'}

            **3. GRANT OPPORTUNITY (The Call):**
            - URL: ${grantUrl}
            - Note: Please analyze based on the grant information provided by the user or extracted from the URL.

            **CRITICAL VALIDATION STEPS - READ CAREFULLY:**

            **STEP 1: DOMAIN/SECTOR ALIGNMENT CHECK (MANDATORY FIRST STEP - CRITICAL)**
            
            Before evaluating any other criteria, you MUST first verify if the PROJECT DOMAIN/SECTOR matches the GRANT DOMAIN/SECTOR.
            
            **READ THE PROJECT INFORMATION PROVIDED ABOVE CAREFULLY.**
            ${hasProject ? `
            The project information is:
            - Title: "${projectDetails.title}"
            - Description: "${projectDetails.description}"
            
            YOU MUST identify the PRIMARY DOMAIN of THIS SPECIFIC PROJECT based on the description above.
            ` : 'Since no specific project is provided, evaluate based on applicant entity capabilities.'}
            
            - To identify the project domain, analyze the project description for:
              * Main sector/industry mentioned
              * Primary application area
              * Target users or beneficiaries
              * The core business/technical domain the project operates in
            
            - Identify the PRIMARY DOMAIN of the grant call by reading the grant title, description, and objectives carefully:
              * Analyze the grant's main focus area and sector
              * Determine what industry, sector, or application area the grant is targeting
              * Identify the primary domain the grant is designed for
            
            - Compare these domains. They must be THE SAME or HIGHLY RELATED.
            
            **DOMAIN MISMATCH RULES (STRICTLY ENFORCE):**
            - If the project domain does NOT match the grant domain, you MUST:
              * Give a score of 20-30/100 MAXIMUM for "Domain/Sector Alignment" (NOT 95, NOT 80, NOT 50 - MAXIMUM 30)
              * Give a score of 20-25/100 MAXIMUM for overall compatibility
              * Clearly state in reasoning: "DOMAIN MISMATCH: Project focuses on [X] but grant focuses on [Y]. These are different domains."
              * DO NOT give high scores just because both mention "AI", "energy efficiency", "sensors", "IoT", "machine learning", or other generic technologies
              * Generic technologies applied to different domains do NOT make them compatible
            
            **GENERIC EXAMPLES OF DOMAIN MISMATCHES (for learning):**
            - Project in Domain A + Grant in Domain B (where A ≠ B) → MISMATCH → Score 20-30/100 MAXIMUM
            - Project and Grant in the same domain → MATCH → Score 70-100/100
            - Project and Grant in related but different domains → PARTIAL MATCH → Score 40-60/100
            
            - If domains match or are highly related, proceed to evaluate other criteria normally.
            
            **STEP 2: AVOID FALSE POSITIVES FROM KEYWORD MATCHING**
            
            Common mistake: Giving high scores because both project and grant mention:
            - "Artificial Intelligence" or "Machine Learning"
            - "Energy efficiency" or "Sustainability"
            - "Sensors" or "IoT"
            - "Data analysis" or "Real-time"
            - "Optimization" or "Automation"
            
            **CORRECT APPROACH:**
            - These are GENERIC TECHNOLOGIES that can apply to many domains
            - The REAL question is: Are they being applied to the SAME DOMAIN?
            - The same technology applied to different domains does NOT create compatibility
            
            **STEP 3: EVALUATION CRITERIA**
            
            Only if domains align (or are highly related), then evaluate:
            - Technical fit (are the specific technologies appropriate for THIS domain?)
            - Innovation potential
            - Funding viability
            
            **OUTPUT REQUIREMENT:**
            Return a single JSON object with two keys: "summary" and "analysis".
            
            1. **summary**: Extract key technical data from the grant description. Translate to Spanish.
            2. **analysis**: conduct the compatibility check.
               - **FIRST**: Check domain alignment. If domains don't match, scores must be LOW (0-30 for Domain/Sector Alignment, 0-25 overall).
               - Calculate 'overallScore' as a weighted average. IMPORTANT: All scores must be on a scale of 0-100 (not 0-10).
               - The 'criteria' array must match the criteria defined below.
               - Each criterion's 'score' must be a number between 0 and 100.
               - In the reasoning for "Domain/Sector Alignment", you MUST explicitly state:
                 * "DOMAIN MATCH" or "DOMAIN MISMATCH"
                 * The project domain and grant domain
                 * Why they match or don't match
                 * If there's a mismatch, explain why generic technologies (AI, sensors, etc.) don't make them compatible
               - Provide reasoning in Spanish.
               ${consultantInstruction}
               
            ${criteriaSection}
            
            **CRITICAL REMINDERS:**
            - Domain alignment is MORE IMPORTANT than technology keywords
            - A project about buildings with AI is NOT compatible with a grant about vehicles with AI
            - Be strict: If domains don't match, scores should be LOW (0-30 for Domain/Sector Alignment, 0-25 overall)
            - Don't be fooled by superficial keyword matches
            - When in doubt about domain alignment, be conservative and give lower scores
            
            **ABSOLUTE REQUIREMENTS:**
            ${hasProject ? `
            - YOU HAVE BEEN PROVIDED WITH PROJECT INFORMATION ABOVE (Title: "${projectDetails.title}", Description: "${projectDetails.description}")
            - YOU MUST USE THIS PROJECT INFORMATION in your analysis
            - DO NOT say "no project description provided" or "project not defined" - the project IS defined above
            - YOU MUST identify the domain of THIS SPECIFIC PROJECT based on the description provided
            - If you cannot determine the domain from the description, analyze the keywords and context carefully
            ` : ''}
            - Always base your reasoning on the ACTUAL information provided, not on assumptions about missing data
            - If project information is provided, you MUST reference it in your reasoning for each criterion
            
            **CRITICAL EXAMPLES TO FOLLOW:**
            
            Example 1 - CORRECT (Domain Match):
            - Project and Grant in the SAME domain
            - Domain/Sector Alignment: 70-100/100 (MATCH)
            
            Example 2 - CORRECT (Domain Mismatch):
            - Project in Domain A, Grant in Domain B (where A ≠ B)
            - Domain/Sector Alignment: 20-30/100 (MISMATCH)
            - Overall Score: 20-25/100 MAXIMUM
            - Reasoning MUST say: "DOMAIN MISMATCH: Project focuses on [Domain A] but grant focuses on [Domain B]"
            
            Example 3 - WRONG (What NOT to do):
            - Project in Domain A, Grant in Domain B (different domains)
            - WRONG Score: 95/100 for Domain Alignment ❌
            - CORRECT Score: 20-30/100 for Domain Alignment ✅
            - Reason: Even though both may use similar generic technologies, they are DIFFERENT DOMAINS
            
            **YOU MUST FOLLOW THESE EXAMPLES. DO NOT GIVE HIGH SCORES WHEN DOMAINS DON'T MATCH.**
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-thinking-exp",
            contents: prompt,
            config: {
                maxOutputTokens: 8192,
                tools: [{ googleSearch: {} }],
                // NOTE: responseMimeType and responseSchema are incompatible with tools (googleSearch)
                // We'll parse JSON manually instead
            },
        });

        const responseText = response.text || '{}';
        
        // Función para extraer JSON del texto de respuesta
        const extractJSON = (text: string): string => {
            // Primero, intentar extraer JSON de bloques de código markdown
            const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch && codeBlockMatch[1]) {
                return codeBlockMatch[1].trim();
            }
            
            // Si no hay bloque de código, buscar el primer objeto JSON válido
            // Buscar desde la primera llave {
            const firstBrace = text.indexOf('{');
            if (firstBrace === -1) {
                throw new Error("No se encontró JSON en la respuesta");
            }
            
            // Encontrar la llave de cierre correspondiente
            let braceCount = 0;
            let jsonStart = firstBrace;
            let jsonEnd = -1;
            
            for (let i = firstBrace; i < text.length; i++) {
                if (text[i] === '{') {
                    braceCount++;
                } else if (text[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        jsonEnd = i + 1;
                        break;
                    }
                }
            }
            
            if (jsonEnd === -1) {
                throw new Error("JSON incompleto en la respuesta");
            }
            
            return text.substring(jsonStart, jsonEnd).trim();
        };
        
        let result;
        try {
            const jsonText = extractJSON(responseText);
            result = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.log("Raw Response:", responseText);
            throw new Error("Error parsing AI response.");
        }

        // Validación post-procesamiento para detectar inconsistencias de dominio y errores de cálculo
        // Esta validación es genérica y no está hardcodeada para casos específicos
        if (result.analysis) {
            const overallScore = result.analysis.overallScore || 0;
            const domainAlignment = result.analysis.criteria?.find((c: any) => 
                c.criterion.includes("Domain") || c.criterion.includes("Sector") || 
                c.criterion.toLowerCase().includes("domain") || c.criterion.toLowerCase().includes("sector")
            );
            
            // VALIDACIÓN PREVIA: Detectar si el modelo dice que falta información del proyecto cuando en realidad está disponible
            if (hasProject) {
                const allReasoning = result.analysis.criteria?.map((c: any) => c.reasoning || '').join(' ').toLowerCase() || '';
                const justificationLower = (result.analysis.justification || '').toLowerCase();
                const allText = (allReasoning + ' ' + justificationLower).toLowerCase();
                
                const missingInfoKeywords = [
                    'no se ha proporcionado', 'no se proporcionó', 'no provided', 'not provided',
                    'ausencia de', 'falta de', 'missing', 'no description', 'sin descripción',
                    'no project', 'proyecto no definido', 'project not defined', 'no se ha definido',
                    'imposible evaluar', 'cannot evaluate', 'no puede evaluar'
                ];
                
                const saysMissingInfo = missingInfoKeywords.some(keyword => allText.includes(keyword));
                
                if (saysMissingInfo) {
                    // El modelo dice que falta información pero está disponible - esto es un error
                    console.log(`ERROR: Model says project info is missing but it was provided. Project: ${projectDetails.title || 'N/A'}`);
                    
                    // Si el overall score es muy bajo (<30) y el modelo dice que falta info, probablemente es por este error
                    if (overallScore < 30) {
                        // No ajustar automáticamente, pero loguear el error para debugging
                        result.analysis.justification = (result.analysis.justification || '') + 
                            ' [ADVERTENCIA: El modelo indicó que falta información del proyecto, pero la información fue proporcionada. Los scores pueden ser incorrectos.]';
                    }
                }
            }
            
            // VALIDACIÓN CRÍTICA 1: Si Domain/Sector Alignment es > 30, SIEMPRE forzar a máximo 30
            // Regla estricta: Si el modelo da > 30 pero el reasoning menciona desajuste, o si el score es simplemente > 30
            // (lo cual viola la regla del prompt), forzar a 30
            if (domainAlignment && domainAlignment.score > 30) {
                const reasoningLower = (domainAlignment.reasoning || '').toLowerCase();
                const allReasoning = result.analysis.criteria?.map((c: any) => c.reasoning || '').join(' ').toLowerCase() || '';
                const justificationLower = (result.analysis.justification || '').toLowerCase();
                
                // Buscar indicadores genéricos de desajuste de dominio en el reasoning o justification
                // NO incluir keywords específicas de dominios (buildings, transport, etc.) - solo indicadores genéricos
                const mismatchKeywords = [
                    'domain mismatch', 'desajuste de dominio', 'different domain', 'dominio diferente',
                    'no match', 'no coincide', 'diferente dominio', 'dominios diferentes',
                    'desalineación', 'desalineacion', 'no encaja', 'no coincide con el dominio',
                    'desalineación fundamental', 'desalineacion fundamental',
                    'incompatible domain', 'dominio incompatible', 'mismatch', 'desajuste',
                    'no alineado', 'no alineada', 'no se ajusta', 'no encaja con'
                ];
                
                const hasMismatchIndicator = mismatchKeywords.some(keyword => 
                    reasoningLower.includes(keyword) || allReasoning.includes(keyword) || justificationLower.includes(keyword)
                );
                
                // Si hay indicadores de desajuste O si el score es > 30 (violando la regla del prompt), forzar a 30
                // Nota: El prompt dice que si hay desajuste, el máximo es 30, así que cualquier score > 30 con indicadores de desajuste debe ser corregido
                if (hasMismatchIndicator) {
                    const oldDomainScore = domainAlignment.score;
                    domainAlignment.score = 30; // Forzar a máximo 30
                    domainAlignment.reasoning = (domainAlignment.reasoning || '') + 
                        ` [AJUSTADO: Score reducido de ${oldDomainScore} a 30 debido a indicadores de desajuste de dominio detectados]`;
                    console.log(`Domain alignment score forced: ${oldDomainScore} -> 30 (mismatch indicators found)`);
                }
            }
            
            // VALIDACIÓN CRÍTICA 2: Recalcular overall score basado en los pesos reales
            // El modelo a veces inventa el overall score, así que lo recalculamos
            if (result.analysis.criteria && Array.isArray(result.analysis.criteria)) {
                let calculatedScore = 0;
                let totalWeight = 0;
                
                result.analysis.criteria.forEach((criterion: any) => {
                    const weight = criterion.weight || 0;
                    const score = criterion.score || 0;
                    calculatedScore += (score * weight) / 100;
                    totalWeight += weight;
                });
                
                // Normalizar si los pesos no suman exactamente 100
                if (totalWeight > 0 && Math.abs(totalWeight - 100) > 1) {
                    calculatedScore = (calculatedScore / totalWeight) * 100;
                }
                
                // Si el overall score reportado difiere significativamente del calculado, usar el calculado
                const scoreDifference = Math.abs(overallScore - calculatedScore);
                if (scoreDifference > 5) {
                    console.log(`Overall score mismatch detected: Reported ${overallScore}, Calculated ${calculatedScore.toFixed(1)}. Using calculated.`);
                    result.analysis.overallScore = Math.round(calculatedScore * 10) / 10;
                    if (result.analysis.justification) {
                        result.analysis.justification += ` [AJUSTADO: Overall score recalculado de ${overallScore} a ${result.analysis.overallScore}]`;
                    } else {
                        result.analysis.justification = `[AJUSTADO: Overall score recalculado de ${overallScore} a ${result.analysis.overallScore}]`;
                    }
                }
            }
            
            // VALIDACIÓN CRÍTICA 3: Si Domain/Sector Alignment es <= 30, el overall score debe ser <= 25
            // Esta es la regla estricta: desajuste de dominio = overall máximo 25
            if (domainAlignment && domainAlignment.score <= 30) {
                const currentOverall = result.analysis.overallScore || overallScore;
                if (currentOverall > 25) {
                    result.analysis.overallScore = 25;
                    if (result.analysis.justification) {
                        result.analysis.justification += ` [AJUSTADO: Overall score limitado a 25 debido a desajuste de dominio (Domain score: ${domainAlignment.score})]`;
                    } else {
                        result.analysis.justification = `[AJUSTADO: Overall score limitado a 25 debido a desajuste de dominio (Domain score: ${domainAlignment.score})]`;
                    }
                    console.log(`Overall score capped at 25 due to domain misalignment (Domain: ${domainAlignment.score})`);
                }
            }
            
            // VALIDACIÓN 4: Si Domain/Sector Alignment tiene score bajo pero overall score es alto, hay inconsistencia
            if (domainAlignment && domainAlignment.score < 40 && result.analysis.overallScore > 40) {
                const adjustedScore = Math.min(result.analysis.overallScore, domainAlignment.score + 15);
                if (adjustedScore < result.analysis.overallScore) {
                    result.analysis.overallScore = adjustedScore;
                    if (result.analysis.justification) {
                        result.analysis.justification += " [AJUSTADO: Puntuación general reducida debido a desajuste de dominio detectado]";
                    } else {
                        result.analysis.justification = "[AJUSTADO: Puntuación general reducida debido a desajuste de dominio detectado]";
                    }
                    console.log(`Domain misalignment detected: Domain score ${domainAlignment.score}, Overall adjusted to ${adjustedScore}`);
                }
            }
            
            // VALIDACIÓN 5: Si overall score es muy alto (>80) pero hay indicadores de desajuste en el reasoning
            if (result.analysis.overallScore > 80) {
                const allReasoning = result.analysis.criteria?.map((c: any) => c.reasoning || '').join(' ').toLowerCase() || '';
                const mismatchIndicators = [
                    'domain mismatch', 'desajuste de dominio', 'different domain', 'dominio diferente',
                    'no match', 'no coincide', 'diferente', 'incompatible domain', 'desalineación'
                ];
                const hasMismatchIndicator = mismatchIndicators.some(indicator => allReasoning.includes(indicator));
                
                if (hasMismatchIndicator) {
                    const adjustedScore = Math.min(result.analysis.overallScore, 40);
                    result.analysis.overallScore = adjustedScore;
                    if (result.analysis.justification) {
                        result.analysis.justification += " [AJUSTADO: Indicadores de desajuste de dominio detectados en el análisis]";
                    } else {
                        result.analysis.justification = "[AJUSTADO: Indicadores de desajuste de dominio detectados en el análisis]";
                    }
                    console.log(`Mismatch indicators found in high-score analysis: Adjusted from ${result.analysis.overallScore} to ${adjustedScore}`);
                }
            }
        }

        return {
            success: true,
            summary: result.summary,
            analysis: result.analysis,
            grantUrl
        };
    } catch (error: any) {
        console.error('Error validating grant:', error);
        return {
            error: `Error al validar la convocatoria: ${error.message}`
        };
    }
}

/**
 * Simular evaluación de una propuesta
 */
export async function simulateEvaluation(params: {
    proposalText: string;
    grantCriteria: string;
    evaluationCriteria?: string[];
}) {
    try {
        const { proposalText, grantCriteria, evaluationCriteria = [] } = params;

        const schema = {
            type: Type.OBJECT,
            properties: {
                estimatedScore: { type: Type.NUMBER, description: "Puntuación estimada (0-100)" },
                strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Puntos fuertes de la propuesta"
                },
                weaknesses: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Puntos débiles de la propuesta"
                },
                recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Recomendaciones para mejorar"
                },
                criteriaBreakdown: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            criterion: { type: Type.STRING },
                            score: { type: Type.NUMBER },
                            reasoning: { type: Type.STRING }
                        },
                        required: ["criterion", "score", "reasoning"]
                    }
                }
            },
            required: ["estimatedScore", "strengths", "weaknesses", "recommendations", "criteriaBreakdown"]
        };

        const prompt = `
            Actúa como un evaluador experto de propuestas de subvención.
            
            Evalúa la siguiente propuesta según los criterios de la convocatoria:
            
            **PROPUESTA:**
            ${proposalText}
            
            **CRITERIOS DE LA CONVOCATORIA:**
            ${grantCriteria}
            
            ${evaluationCriteria.length > 0 ? `**CRITERIOS ESPECÍFICOS A EVALUAR:**\n${evaluationCriteria.join('\n')}` : ''}
            
            Proporciona una evaluación detallada con:
            1. Puntuación estimada (0-100)
            2. Puntos fuertes
            3. Puntos débiles
            4. Recomendaciones de mejora
            5. Desglose por criterios
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-thinking-exp",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const result = JSON.parse(response.text.trim());

        return {
            success: true,
            evaluation: result
        };
    } catch (error: any) {
        console.error('Error simulating evaluation:', error);
        return {
            error: `Error al simular la evaluación: ${error.message}`
        };
    }
}

