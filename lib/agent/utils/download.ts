/**
 * Utilidades para descargar documentos generados
 */

import { jsPDF } from 'jspdf';

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
 * Convertir markdown a texto plano (remover formato)
 */
function markdownToPlainText(markdown: string): string {
    return markdown
        .replace(/^#+\s+/gm, '') // Headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1') // Italic
        .replace(/`(.*?)`/g, '$1') // Inline code
        .replace(/```[\s\S]*?```/g, '') // Code blocks
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
        .replace(/^\s*[-*+]\s+/gm, '• ') // Lists
        .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
        .trim();
}

/**
 * Parsear markdown y extraer elementos estructurados
 */
interface MarkdownElement {
    type: 'heading' | 'paragraph' | 'list' | 'code' | 'bold' | 'italic' | 'link' | 'text';
    content: string;
    level?: number;
    items?: string[];
}

function parseMarkdown(markdown: string): MarkdownElement[] {
    const elements: MarkdownElement[] = [];
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            elements.push({ type: 'text', content: '' });
            continue;
        }
        
        // Headers
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
            elements.push({
                type: 'heading',
                content: headerMatch[2],
                level: headerMatch[1].length
            });
            continue;
        }
        
        // Listas
        if (line.match(/^[-*+]\s+/)) {
            const items: string[] = [];
            while (i < lines.length && lines[i].trim().match(/^[-*+]\s+/)) {
                items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
                i++;
            }
            i--; // Ajustar índice
            elements.push({ type: 'list', items });
            continue;
        }
        
        // Code blocks
        if (line.startsWith('```')) {
            const codeLines: string[] = [];
            i++; // Saltar línea de inicio
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push({ type: 'code', content: codeLines.join('\n') });
            continue;
        }
        
        // Párrafos normales
        elements.push({ type: 'paragraph', content: line });
    }
    
    return elements;
}

/**
 * Renderizar texto con formato (negritas, cursivas, etc.) en PDF
 */
function renderFormattedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, fontSize: number): number {
    // Primero, limpiar el texto de markdown básico y renderizarlo con formato
    // Procesar negritas **texto**
    const parts: Array<{ text: string; bold: boolean; italic: boolean }> = [];
    let processedText = text;
    let lastIndex = 0;
    
    // Procesar negritas primero
    const boldRegex = /\*\*(.*?)\*\*/g;
    const boldMatches: Array<{ start: number; end: number; text: string }> = [];
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
        boldMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[1]
        });
    }
    
    // Procesar cursivas *texto* (solo si no están dentro de negritas)
    const italicRegex = /\*(.*?)\*/g;
    const italicMatches: Array<{ start: number; end: number; text: string }> = [];
    while ((match = italicRegex.exec(text)) !== null) {
        // Verificar que no esté dentro de una negrita
        const isInsideBold = boldMatches.some(b => match!.index >= b.start && match!.index < b.end);
        if (!isInsideBold) {
            italicMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[1]
            });
        }
    }
    
    // Combinar y ordenar todos los matches
    const allMatches = [
        ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
        ...italicMatches.map(m => ({ ...m, type: 'italic' as const }))
    ].sort((a, b) => a.start - b.start);
    
    // Construir partes del texto
    let currentIndex = 0;
    allMatches.forEach(match => {
        if (match.start > currentIndex) {
            parts.push({ 
                text: text.substring(currentIndex, match.start), 
                bold: false, 
                italic: false 
            });
        }
        parts.push({ 
            text: match.text, 
            bold: match.type === 'bold', 
            italic: match.type === 'italic' 
        });
        currentIndex = match.end;
    });
    
    if (currentIndex < text.length) {
        parts.push({ 
            text: text.substring(currentIndex), 
            bold: false, 
            italic: false 
        });
    }
    
    if (parts.length === 0) {
        parts.push({ text, bold: false, italic: false });
    }
    
    // Renderizar las partes
    let currentX = x;
    let currentY = y;
    const lineHeight = fontSize * 1.4;
    const startX = x;
    
    parts.forEach(part => {
        doc.setFont('helvetica', part.bold ? 'bold' : part.italic ? 'italic' : 'normal');
        doc.setFontSize(fontSize);
        
        // Calcular el ancho disponible
        const availableWidth = maxWidth - (currentX - startX);
        
        if (availableWidth <= 0) {
            currentX = startX;
            currentY += lineHeight;
        }
        
        // Dividir el texto en líneas que caben
        const lines = doc.splitTextToSize(part.text, availableWidth > 0 ? availableWidth : maxWidth);
        
        lines.forEach((line: string, lineIndex: number) => {
            if (lineIndex > 0 || (currentX - startX) + doc.getTextWidth(line) > maxWidth) {
                currentX = startX;
                currentY += lineHeight;
            }
            
            doc.text(line, currentX, currentY);
            currentX += doc.getTextWidth(line);
        });
    });
    
    return currentY + lineHeight;
}

/**
 * Generar y descargar PDF desde markdown/conversación con formato mejorado
 */
export function downloadPDF(content: string, filename: string, title: string = 'Conversación') {
    try {
        const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        const margin = 56.7; // 2cm
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const contentWidth = pageWidth - (margin * 2);
        let y = margin + 40;

        // Título principal
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(184, 78, 157); // Color primario
        const titleLines = doc.splitTextToSize(title, contentWidth);
        doc.text(titleLines, margin, y);
        y += titleLines.length * 28 + 20;

        // Fecha
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, margin, y);
        y += 30;

        // Línea separadora
        doc.setDrawColor(184, 78, 157);
        doc.setLineWidth(1);
        doc.line(margin, y, pageWidth - margin, y);
        y += 20;

        // Parsear y renderizar markdown
        const lines = content.split('\n');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Verificar si necesitamos nueva página
            if (y > pageHeight - margin - 40) {
                doc.addPage();
                y = margin;
            }
            
            if (!line) {
                y += 10; // Espacio en blanco
                continue;
            }
            
            // Headers
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                let headerText = headerMatch[2];
                // Remover markdown del header ya que los headers ya son bold por defecto
                headerText = headerText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
                const headerSize = level === 1 ? 16 : level === 2 ? 14 : 12;
                
                y += 15; // Espacio antes del header
                doc.setFontSize(headerSize);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(42, 59, 90); // Color secundario
                const headerLines = doc.splitTextToSize(headerText, contentWidth);
                doc.text(headerLines, margin, y);
                y += headerLines.length * (headerSize * 1.3) + 10;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                continue;
            }
            
            // Texto en cursiva (líneas que empiezan con *)
            if (line.match(/^\*\s/) || (line.startsWith('*') && line.endsWith('*') && !line.match(/\*\*/))) {
                const italicText = line.replace(/^\*\s*/, '').replace(/\*$/, '');
                y += 5;
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                const italicLines = doc.splitTextToSize(italicText, contentWidth);
                doc.text(italicLines, margin, y);
                y += italicLines.length * 14 + 5;
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                continue;
            }
            
            // Separadores
            if (line.match(/^---+$/)) {
                y += 10;
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(margin, y, pageWidth - margin, y);
                y += 15;
                continue;
            }
            
            // Listas
            if (line.match(/^[-*+]\s+/)) {
                const listItems: string[] = [];
                while (i < lines.length && lines[i].trim().match(/^[-*+]\s+/)) {
                    listItems.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
                    i++;
                }
                i--; // Ajustar índice
                
                y += 5;
                listItems.forEach((item, idx) => {
                    if (y > pageHeight - margin - 20) {
                        doc.addPage();
                        y = margin;
                    }
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text('•', margin, y);
                    // Renderizar el item con formato (negritas, etc.)
                    y = renderFormattedText(doc, item, margin + 15, y, contentWidth - 20, 10);
                });
                y += 5;
                continue;
            }
            
            // Code blocks
            if (line.startsWith('```')) {
                const codeLines: string[] = [];
                i++; // Saltar línea de inicio
                while (i < lines.length && !lines[i].trim().startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                
                y += 5;
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, y - 10, contentWidth, codeLines.length * 14 + 10, 'F');
                doc.setFont('courier', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                codeLines.forEach(codeLine => {
                    if (y > pageHeight - margin - 20) {
                        doc.addPage();
                        y = margin;
                    }
                    const codeText = doc.splitTextToSize(codeLine, contentWidth - 10);
                    doc.text(codeText, margin + 5, y);
                    y += codeText.length * 14;
                });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                y += 10;
                continue;
            }
            
            // Párrafos normales con formato
            // Procesar el texto para renderizar markdown correctamente
            y = renderFormattedText(doc, line, margin, y, contentWidth, 10);
            y += 8; // Espacio entre párrafos
        }

        doc.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback a texto plano
        downloadText(markdownToPlainText(content), filename.replace('.pdf', '.txt'), 'text/plain');
    }
}

/**
 * Generar y descargar DOCX desde markdown
 * Nota: Para una implementación completa, instalar 'docx' package
 */
export function downloadDOCX(content: string, filename: string) {
    // Por ahora, descargamos como texto plano formateado
    // Para producción completa, instalar: npm install docx
    const plainText = markdownToPlainText(content);
    const formattedText = `CONVERSACIÓN EXPORTADA\n\n${'='.repeat(50)}\n\n${plainText}`;
    downloadText(formattedText, filename.replace('.docx', '.txt'), 'text/plain');
}

/**
 * Exportar conversación completa a múltiples formatos
 */
export interface ConversationMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: string;
    priority?: 'Low' | 'Medium' | 'High';
}

export function exportConversation(
    messages: ConversationMessage[],
    format: 'markdown' | 'pdf' | 'json' | 'docx',
    filename?: string
) {
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `conversacion-${timestamp}`;

    switch (format) {
        case 'markdown': {
            const markdown = messages.map(msg => {
                const roleLabel = msg.role === 'user' ? '**Usuario**' : '**Dr. Win**';
                const priorityBadge = msg.priority ? ` [${msg.priority}]` : '';
                const time = new Date(msg.timestamp).toLocaleString('es-ES');
                return `${roleLabel}${priorityBadge} (${time})\n\n${msg.text}\n\n---\n\n`;
            }).join('\n');
            downloadMarkdown(markdown, `${filename || defaultFilename}.md`);
            break;
        }
        case 'pdf': {
            // Generar markdown formateado para el PDF
            const markdown = messages.map((msg, index) => {
                const roleLabel = msg.role === 'user' ? 'Usuario' : 'Dr. Win';
                const priorityBadge = msg.priority ? ` [${msg.priority}]` : '';
                const time = new Date(msg.timestamp).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                // Mantener el markdown del mensaje original para que se renderice correctamente
                return `## **${roleLabel}**${priorityBadge}\n\n*${time}*\n\n${msg.text || ''}\n\n---\n\n`;
            }).join('\n');
            downloadPDF(markdown, `${filename || defaultFilename}.pdf`, 'Conversación con Dr. Win');
            break;
        }
        case 'json': {
            downloadJSON(messages, `${filename || defaultFilename}.json`);
            break;
        }
        case 'docx': {
            const content = messages.map(msg => {
                const roleLabel = msg.role === 'user' ? 'Usuario' : 'Dr. Win';
                const time = new Date(msg.timestamp).toLocaleString('es-ES');
                return `[${roleLabel}] (${time})\n${msg.text}\n\n`;
            }).join('\n');
            downloadDOCX(content, `${filename || defaultFilename}.docx`);
            break;
        }
    }
}

