import React, { useMemo } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useSettings } from '../../../context/SettingsContext';
import { getUsageStats, getLastWeekActivity, calculateSuccessRate } from '../../../lib/utils/analytics';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

const Statistics: React.FC = () => {
    const { t } = useLanguage();
    const { settings } = useSettings();

    const stats = useMemo(() => getUsageStats(settings.conversationHistory), [settings.conversationHistory]);
    const lastWeekActivity = useMemo(() => getLastWeekActivity(stats), [stats]);
    const successRate = useMemo(() => calculateSuccessRate(settings.conversationHistory), [settings.conversationHistory]);

    const maxActivity = Math.max(...lastWeekActivity.map(a => a.count), 1);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary dark:text-neutral-200 mb-2">Estadísticas de Uso</h1>
                <p className="text-muted-foreground">Resumen de tu actividad con Dr. Win</p>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Mensajes</p>
                            <p className="text-3xl font-bold text-primary mt-1">{stats.totalMessages}</p>
                        </div>
                        <span className="material-symbols-outlined text-4xl text-primary/30">chat</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Tareas Creadas</p>
                            <p className="text-3xl font-bold text-primary mt-1">{stats.totalTasks}</p>
                        </div>
                        <span className="material-symbols-outlined text-4xl text-primary/30">task_alt</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                            <p className="text-3xl font-bold text-primary mt-1">{successRate}%</p>
                        </div>
                        <span className="material-symbols-outlined text-4xl text-primary/30">trending_up</span>
                    </div>
                </motion.div>
            </div>

            {/* Uso por módulo */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm"
            >
                <h2 className="text-lg font-semibold mb-4">Uso por Módulo</h2>
                <div className="space-y-3">
                    {Object.entries(stats.moduleUsage)
                        .sort(([, a], [, b]) => b - a)
                        .map(([module, count], index) => {
                            const total = Object.values(stats.moduleUsage).reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                            
                            return (
                                <div key={module}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{module}</span>
                                        <span className="text-sm text-muted-foreground">{count} usos ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-primary to-primary-600"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    {Object.keys(stats.moduleUsage).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Aún no hay datos de uso por módulo
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Actividad de la última semana */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm"
            >
                <h2 className="text-lg font-semibold mb-4">Actividad de la Última Semana</h2>
                <div className="flex items-end justify-between gap-2 h-32">
                    {lastWeekActivity.map((day, index) => {
                        const height = (day.count / maxActivity) * 100;
                        const date = new Date(day.date);
                        const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                        
                        return (
                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
                                    className={cn(
                                        "w-full rounded-t bg-gradient-to-t from-primary to-primary-400 min-h-[4px]",
                                        day.count === 0 && "bg-neutral-200 dark:bg-neutral-700"
                                    )}
                                />
                                <span className="text-xs text-muted-foreground">{dayName}</span>
                                <span className="text-xs font-semibold">{day.count}</span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default Statistics;

