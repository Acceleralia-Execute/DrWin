/**
 * Utilidades para integración con calendario
 * Extracción de deadlines, recordatorios, exportación a iCal/Google Calendar
 */

export interface CalendarEvent {
    title: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
    url?: string;
}

/**
 * Extraer fechas límite de un texto de convocatoria
 */
export function extractDeadlines(text: string): Date[] {
    const deadlines: Date[] = [];
    
    // Patrones comunes de fechas límite
    const patterns = [
        /fecha\s+límite[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
        /deadline[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
        /cierre[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
    ];
    
    patterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            try {
                let day: number, month: number, year: number;
                
                if (match.length >= 4) {
                    day = parseInt(match[1]);
                    month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
                    year = parseInt(match[3]);
                } else {
                    continue;
                }
                
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    deadlines.push(date);
                }
            } catch (e) {
                // Ignore invalid dates
            }
        }
    });
    
    // Eliminar duplicados y ordenar
    return Array.from(new Set(deadlines.map(d => d.getTime())))
        .map(t => new Date(t))
        .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Generar archivo iCal (.ics) para importar en calendarios
 */
export function generateICal(events: CalendarEvent[]): string {
    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//DrWin//Calendar//ES\r\n';
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';
    
    events.forEach(event => {
        ical += 'BEGIN:VEVENT\r\n';
        ical += `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@drwin.ai\r\n`;
        ical += `DTSTAMP:${formatICalDate(new Date())}\r\n`;
        ical += `DTSTART:${formatICalDate(event.startDate)}\r\n`;
        if (event.endDate) {
            ical += `DTEND:${formatICalDate(event.endDate)}\r\n`;
        } else {
            // Si no hay fecha de fin, usar la misma fecha de inicio
            const endDate = new Date(event.startDate);
            endDate.setHours(23, 59, 59);
            ical += `DTEND:${formatICalDate(endDate)}\r\n`;
        }
        ical += `SUMMARY:${escapeICalText(event.title)}\r\n`;
        ical += `DESCRIPTION:${escapeICalText(event.description)}\r\n`;
        if (event.location) {
            ical += `LOCATION:${escapeICalText(event.location)}\r\n`;
        }
        if (event.url) {
            ical += `URL:${event.url}\r\n`;
        }
        ical += 'END:VEVENT\r\n';
    });
    
    ical += 'END:VCALENDAR\r\n';
    return ical;
}

/**
 * Formatear fecha para iCal (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapar texto para iCal
 */
function escapeICalText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Descargar archivo iCal
 */
export function downloadICal(events: CalendarEvent[], filename: string = 'drwin-calendar.ics') {
    const icalContent = generateICal(events);
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
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
 * Generar URL de Google Calendar
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        details: event.description,
        dates: `${formatGoogleCalendarDate(event.startDate)}/${formatGoogleCalendarDate(event.endDate || event.startDate)}`,
    });
    
    if (event.location) {
        params.append('location', event.location);
    }
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Formatear fecha para Google Calendar (YYYYMMDDTHHMMSSZ)
 */
function formatGoogleCalendarDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Crear recordatorio (notificación del navegador)
 */
export async function createReminder(event: CalendarEvent, minutesBefore: number = 60): Promise<void> {
    if (!('Notification' in window)) {
        console.warn('Este navegador no soporta notificaciones');
        return;
    }
    
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    
    if (Notification.permission === 'granted') {
        const reminderTime = new Date(event.startDate.getTime() - minutesBefore * 60 * 1000);
        const now = new Date();
        const delay = reminderTime.getTime() - now.getTime();
        
        if (delay > 0) {
            setTimeout(() => {
                new Notification(event.title, {
                    body: event.description,
                    icon: '/favicon.ico',
                    tag: `reminder-${event.startDate.getTime()}`,
                });
            }, delay);
        }
    }
}

