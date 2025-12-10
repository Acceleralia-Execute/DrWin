/**
 * Templates de prompts predefinidos para tareas comunes
 */

export interface PromptTemplate {
    id: string;
    title: string;
    description: string;
    category: 'Find' | 'Create' | 'Validate' | 'Readapt' | 'General';
    prompt: string;
    tags: string[];
}

export const promptTemplates: PromptTemplate[] = [
    // FIND Templates
    {
        id: 'find-opportunities',
        title: 'Buscar Oportunidades',
        description: 'Busca oportunidades de financiación que se ajusten a tu perfil',
        category: 'Find',
        prompt: 'Por favor, busca las mejores oportunidades de financiación para mi proyecto. Analiza las convocatorias activas y muéstrame las que se ajustan mejor a mi perfil o proyecto.',
        tags: ['búsqueda', 'oportunidades', 'convocatorias']
    },
    {
        id: 'find-compare',
        title: 'Comparar Subvenciones',
        description: 'Compara diferentes subvenciones en una tabla',
        category: 'Find',
        prompt: '¿Puedes comparar diferentes subvenciones para mí? Genera una tabla con los fondos disponibles, requisitos y plazos para que pueda elegir la mejor opción.',
        tags: ['comparar', 'tabla', 'análisis']
    },
    // VALIDATE Templates
    {
        id: 'validate-eligibility',
        title: 'Validar Elegibilidad',
        description: 'Evalúa si tu proyecto cumple los criterios',
        category: 'Validate',
        prompt: '¿Puedes evaluar si mi proyecto cumple los criterios de elegibilidad? Quiero saber en qué programas tiene más posibilidades de éxito.',
        tags: ['validación', 'elegibilidad', 'criterios']
    },
    {
        id: 'validate-simulation',
        title: 'Simular Evaluación',
        description: 'Simula una evaluación real de tu propuesta',
        category: 'Validate',
        prompt: '¿Puedes simular una evaluación real de mi propuesta? Estima la puntuación que obtendría según los criterios oficiales.',
        tags: ['simulación', 'evaluación', 'puntuación']
    },
    // CREATE Templates
    {
        id: 'create-draft',
        title: 'Redactar Propuesta',
        description: 'Ayuda para redactar tu propuesta',
        category: 'Create',
        prompt: 'Necesito ayuda para redactar mi propuesta. Por favor, genera textos técnicos, resúmenes ejecutivos y secciones completas adaptadas a la convocatoria.',
        tags: ['redacción', 'propuesta', 'texto']
    },
    {
        id: 'create-review',
        title: 'Revisar Propuesta',
        description: 'Revisa tu propuesta antes de enviarla',
        category: 'Create',
        prompt: 'Por favor, revisa mi propuesta antes de enviarla. Detecta incoherencias y sugiere mejoras para aumentar mis posibilidades de éxito.',
        tags: ['revisión', 'mejoras', 'análisis']
    },
    {
        id: 'create-concept',
        title: 'Generar Concepto',
        description: 'Genera un concepto completo de proyecto',
        category: 'Create',
        prompt: 'Necesito generar un concepto completo de proyecto. Por favor, incluye la idea principal, objetivos específicos, socios potenciales y paquetes de trabajo.',
        tags: ['concepto', 'proyecto', 'generación']
    },
    // READAPT Templates
    {
        id: 'readapt-adapt',
        title: 'Adaptar Propuesta',
        description: 'Adapta una propuesta existente a una nueva convocatoria',
        category: 'Readapt',
        prompt: 'Necesito adaptar una propuesta existente a una nueva convocatoria. Por favor, analiza las diferencias y sugiere los cambios necesarios.',
        tags: ['adaptación', 'modificación', 'reutilización']
    },
    // General Templates
    {
        id: 'general-help',
        title: 'Ayuda General',
        description: 'Pregunta general sobre subvenciones',
        category: 'General',
        prompt: '¿En qué puedes ayudarme con mi proyecto de subvenciones?',
        tags: ['ayuda', 'general']
    }
];

/**
 * Obtener templates por categoría
 */
export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return promptTemplates.filter(t => t.category === category);
}

/**
 * Buscar templates por texto
 */
export function searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return promptTemplates.filter(t => 
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}

/**
 * Obtener template por ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
    return promptTemplates.find(t => t.id === id);
}

