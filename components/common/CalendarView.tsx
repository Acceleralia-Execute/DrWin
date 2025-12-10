import React, { useState, useMemo } from 'react';
import { CalendarEvent, extractDeadlines, downloadICal, generateGoogleCalendarUrl } from '../../lib/utils/calendarIntegration';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface CalendarViewProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, onEventClick }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const monthEvents = useMemo(() => {
        return events.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate.getMonth() === selectedMonth.getMonth() &&
                   eventDate.getFullYear() === selectedMonth.getFullYear();
        });
    }, [events, selectedMonth]);

    const handleExportICal = () => {
        downloadICal(events, `drwin-calendar-${new Date().toISOString().split('T')[0]}.ics`);
    };

    const handleExportGoogleCalendar = (event: CalendarEvent) => {
        window.open(generateGoogleCalendarUrl(event), '_blank');
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedMonth);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setSelectedMonth(newDate);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    {selectedMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                        <span className="material-symbols-outlined">chevron_left</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMonth(new Date())}>
                        Hoy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                        <span className="material-symbols-outlined">chevron_right</span>
                    </Button>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                    <p>No hay eventos programados</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={handleExportICal}>
                            <span className="material-symbols-outlined mr-2 text-base">download</span>
                            Exportar iCal
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {monthEvents.map((event, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                                onClick={() => onEventClick?.(event)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                                        <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                {event.startDate.toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportGoogleCalendar(event);
                                            }}
                                            title="Añadir a Google Calendar"
                                        >
                                            <span className="material-symbols-outlined text-base">event</span>
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

