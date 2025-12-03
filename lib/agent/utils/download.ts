/**
 * Utilidades para descargar documentos generados
 */

/**
 * Descargar texto como archivo
 */
export function downloadText(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Descargar JSON como archivo
 */
export function downloadJSON(data: any, filename: string) {
    const content = JSON.stringify(data, null, 2);
    downloadText(content, filename, 'application/json');
}

/**
 * Descargar markdown como archivo
 */
export function downloadMarkdown(content: string, filename: string) {
    downloadText(content, filename, 'text/markdown');
}

/**
 * Generar y descargar documento Word (DOCX) desde markdown
 * Nota: Esta es una implementación básica. Para producción, considera usar una librería como docx
 */
export function downloadDOCX(content: string, filename: string) {
    // Por ahora, descargamos como texto plano
    // En producción, podrías usar una librería como 'docx' para generar DOCX real
    downloadText(content, filename.replace('.docx', '.txt'), 'text/plain');
}

/**
 * Generar y descargar PDF desde markdown
 * Nota: Esta es una implementación básica. Para producción, considera usar una librería como jsPDF
 */
export function downloadPDF(content: string, filename: string) {
    // Por ahora, descargamos como texto plano
    // En producción, podrías usar una librería como 'jspdf' o 'puppeteer' para generar PDF real
    downloadText(content, filename.replace('.pdf', '.txt'), 'text/plain');
}

