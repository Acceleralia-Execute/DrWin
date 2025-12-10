import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export type TaskFilter = {
    priority?: 'Low' | 'Medium' | 'High';
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
};

interface TaskFiltersProps {
    filters: TaskFilter;
    onFiltersChange: (filters: TaskFilter) => void;
    taskCount: number;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, onFiltersChange, taskCount }) => {
    const priorities: Array<'Low' | 'Medium' | 'High' | undefined> = [undefined, 'High', 'Medium', 'Low'];
    const priorityLabels = {
        undefined: 'Todas',
        'High': 'Alta',
        'Medium': 'Media',
        'Low': 'Baja'
    };

    const priorityColors = {
        undefined: 'bg-neutral-200 dark:bg-neutral-700',
        'High': 'bg-red-500',
        'Medium': 'bg-yellow-500',
        'Low': 'bg-blue-500'
    };

    const handlePriorityChange = (priority: 'Low' | 'Medium' | 'High' | undefined) => {
        onFiltersChange({ ...filters, priority });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, search: e.target.value });
    };

    const clearFilters = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = filters.priority || filters.search;

    return (
        <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">
                    {taskCount} {taskCount === 1 ? 'tarea' : 'tareas'}
                </h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                    >
                        Limpiar filtros
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {/* Filtro de prioridad */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Prioridad:</span>
                    {priorities.map(priority => (
                        <Button
                            key={priority || 'all'}
                            variant={filters.priority === priority ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handlePriorityChange(priority)}
                            className={cn(
                                "text-xs h-7 px-2",
                                filters.priority === priority && "shadow-sm"
                            )}
                        >
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                priorityColors[priority as keyof typeof priorityColors]
                            )} />
                            {priorityLabels[priority as keyof typeof priorityLabels]}
                        </Button>
                    ))}
                </div>

                {/* Búsqueda */}
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Buscar en tareas..."
                        value={filters.search || ''}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-1.5 text-sm border border-border/50 rounded-md bg-background/80 dark:bg-background/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                </div>
            </div>
        </div>
    );
};

