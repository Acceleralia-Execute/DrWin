/**
 * Utilidades para análisis y estadísticas de uso
 */

export interface UsageStats {
    toolUsage: Record<string, number>;
    dailyActivity: Array<{ date: string; count: number }>;
    moduleUsage: Record<string, number>;
    totalMessages: number;
    totalTasks: number;
}

// Mapeo de herramientas a módulos (debe coincidir con TOOL_TO_MINIWIN en agent.ts)
const TOOL_TO_MODULE: Record<string, string> = {
    searchOpportunities: 'Find',
    compareGrants: 'Find',
    validateGrant: 'Validate',
    simulateEvaluation: 'Validate',
    generateConcept: 'Create',
    generatePublicationContent: 'Create',
    draftProposalSection: 'Create',
    reviewProposal: 'Create',
    extractProposalData: 'Readapt',
    analyzeObservations: 'Readapt',
    adaptProposal: 'Readapt',
    generateReapplicationPlan: 'Readapt',
    extractEntities: 'Validate',
    generateSummary: 'Validate',
    compareDocuments: 'Find',
    analyzeDocumentStructure: 'Validate',
};

/**
 * Obtener estadísticas de uso desde el historial de conversaciones
 */
export function getUsageStats(conversationHistory: any[]): UsageStats {
    const toolUsage: Record<string, number> = {};
    const moduleUsage: Record<string, number> = {};
    const dailyActivityMap: Record<string, number> = {};
    
    let totalTasks = 0;

    conversationHistory.forEach(msg => {
        // Contar tareas
        if (msg.priority) {
            totalTasks++;
        }

        // Contar actividad diaria
        if (msg.timestamp) {
            const date = new Date(msg.timestamp).toISOString().split('T')[0];
            dailyActivityMap[date] = (dailyActivityMap[date] || 0) + 1;
        }

        // Detectar herramientas usadas directamente desde toolCalls
        if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
            msg.toolCalls.forEach((toolCall: { name: string; args?: any }) => {
                const toolName = toolCall.name;
                
                // Contar uso de herramienta
                toolUsage[toolName] = (toolUsage[toolName] || 0) + 1;
                
                // Contar uso de módulo
                const module = TOOL_TO_MODULE[toolName];
                if (module) {
                    moduleUsage[module] = (moduleUsage[module] || 0) + 1;
                }
            });
        }
    });

    // Convertir dailyActivityMap a array ordenado
    const dailyActivity = Object.entries(dailyActivityMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        toolUsage,
        dailyActivity,
        moduleUsage,
        totalMessages: conversationHistory.length,
        totalTasks
    };
}

/**
 * Obtener herramientas más usadas
 */
export function getMostUsedTools(stats: UsageStats, limit: number = 5): Array<{ name: string; count: number }> {
    return Object.entries(stats.toolUsage)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Obtener actividad de la última semana
 */
export function getLastWeekActivity(stats: UsageStats): Array<{ date: string; count: number }> {
    const today = new Date();
    const lastWeek: Array<{ date: string; count: number }> = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const activity = stats.dailyActivity.find(a => a.date === dateStr);
        lastWeek.push({
            date: dateStr,
            count: activity?.count || 0
        });
    }
    
    return lastWeek;
}

/**
 * Calcular tasa de éxito (placeholder - se puede mejorar con datos reales)
 */
export function calculateSuccessRate(conversationHistory: any[]): number {
    // Por ahora, calculamos un porcentaje basado en mensajes con resultados positivos
    // Esto se puede mejorar con datos reales de propuestas exitosas
    const positiveKeywords = ['éxito', 'aprobado', 'aceptado', 'completado', 'listo'];
    let positiveCount = 0;
    
    conversationHistory.forEach(msg => {
        if (msg.text) {
            const text = msg.text.toLowerCase();
            if (positiveKeywords.some(keyword => text.includes(keyword))) {
                positiveCount++;
            }
        }
    });
    
    if (conversationHistory.length === 0) return 0;
    return Math.round((positiveCount / conversationHistory.length) * 100);
}

