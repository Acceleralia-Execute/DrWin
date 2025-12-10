/**
 * Utilidades para búsqueda y filtrado de conversaciones
 */

export interface ConversationFilter {
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    role?: 'user' | 'model';
    priority?: 'Low' | 'Medium' | 'High';
    module?: 'Find' | 'Create' | 'Validate' | 'Readapt';
}

export interface ConversationMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: string;
    priority?: 'Low' | 'Medium' | 'High';
    attachments?: any[];
}

/**
 * Buscar en conversaciones
 */
export function searchConversations(
    messages: ConversationMessage[],
    filter: ConversationFilter
): ConversationMessage[] {
    let results = [...messages];

    // Búsqueda por texto
    if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        results = results.filter(msg => 
            msg.text?.toLowerCase().includes(searchLower)
        );
    }

    // Filtro por fecha desde
    if (filter.dateFrom) {
        results = results.filter(msg => {
            const msgDate = new Date(msg.timestamp);
            return msgDate >= filter.dateFrom!;
        });
    }

    // Filtro por fecha hasta
    if (filter.dateTo) {
        results = results.filter(msg => {
            const msgDate = new Date(msg.timestamp);
            return msgDate <= filter.dateTo!;
        });
    }

    // Filtro por rol
    if (filter.role) {
        results = results.filter(msg => msg.role === filter.role);
    }

    // Filtro por prioridad
    if (filter.priority) {
        results = results.filter(msg => msg.priority === filter.priority);
    }

    // Filtro por módulo (basado en texto del mensaje)
    if (filter.module) {
        const moduleKeywords: Record<string, string[]> = {
            'Find': ['explora', 'buscar', 'oportunidades', 'convocatorias', 'find'],
            'Create': ['inventa', 'crear', 'generar', 'redactar', 'create'],
            'Validate': ['ponder', 'validar', 'evaluar', 'simular', 'validate'],
            'Readapt': ['transcripto', 'adaptar', 'modificar', 'readapt']
        };

        const keywords = moduleKeywords[filter.module] || [];
        results = results.filter(msg => {
            const text = msg.text?.toLowerCase() || '';
            return keywords.some(keyword => text.includes(keyword));
        });
    }

    return results;
}

/**
 * Búsqueda semántica básica (por ahora usa búsqueda de texto, se puede mejorar con embeddings)
 */
export function semanticSearch(
    messages: ConversationMessage[],
    query: string
): ConversationMessage[] {
    // Por ahora, implementación básica con búsqueda de texto
    // En el futuro se puede mejorar con embeddings o búsqueda vectorial
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    return messages.filter(msg => {
        const text = msg.text?.toLowerCase() || '';
        
        // Buscar coincidencias de palabras clave
        const matches = queryWords.filter(word => text.includes(word));
        
        // Si al menos una palabra clave coincide, incluir el mensaje
        return matches.length > 0;
    });
}

/**
 * Guardar búsqueda frecuente
 */
export function saveSearchQuery(query: string, filter: ConversationFilter): void {
    const savedSearches = getSavedSearches();
    const newSearch = {
        id: Date.now().toString(),
        query,
        filter,
        createdAt: new Date().toISOString()
    };
    
    savedSearches.unshift(newSearch);
    // Mantener solo las últimas 10 búsquedas
    const limited = savedSearches.slice(0, 10);
    localStorage.setItem('drwin-saved-searches', JSON.stringify(limited));
}

/**
 * Obtener búsquedas guardadas
 */
export function getSavedSearches(): Array<{
    id: string;
    query: string;
    filter: ConversationFilter;
    createdAt: string;
}> {
    try {
        const saved = localStorage.getItem('drwin-saved-searches');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

/**
 * Eliminar búsqueda guardada
 */
export function deleteSavedSearch(id: string): void {
    const savedSearches = getSavedSearches();
    const filtered = savedSearches.filter(s => s.id !== id);
    localStorage.setItem('drwin-saved-searches', JSON.stringify(filtered));
}

