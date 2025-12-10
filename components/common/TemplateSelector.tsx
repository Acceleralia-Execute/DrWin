import React, { useState } from 'react';
import { Button } from '../ui/Button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '../ui/DropdownMenu';
import { promptTemplates, PromptTemplate, getTemplatesByCategory } from '../../lib/templates/promptTemplates';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';

interface TemplateSelectorProps {
    onSelect: (template: PromptTemplate) => void;
    disabled?: boolean;
}

const categoryIcons: Record<PromptTemplate['category'], string> = {
    'Find': 'search',
    'Create': 'edit',
    'Validate': 'verified',
    'Readapt': 'sync',
    'General': 'help'
};

const categoryLabels: Record<PromptTemplate['category'], string> = {
    'Find': 'Buscar',
    'Create': 'Crear',
    'Validate': 'Validar',
    'Readapt': 'Adaptar',
    'General': 'General'
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, disabled = false }) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');

    const categories: PromptTemplate['category'][] = ['Find', 'Create', 'Validate', 'Readapt', 'General'];
    
    const filteredTemplates = searchQuery.trim() 
        ? promptTemplates.filter(t => 
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : promptTemplates;

    const handleTemplateClick = (template: PromptTemplate) => {
        onSelect(template);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={disabled}
                    className="h-8 w-8"
                    title="Usar template"
                >
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-80 max-h-96 overflow-y-auto mb-2">
                <DropdownMenuLabel>Templates de Prompts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Barra de búsqueda */}
                <div className="px-2 py-1.5">
                    <input
                        type="text"
                        placeholder="Buscar template..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                
                <DropdownMenuSeparator />

                {filteredTemplates.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        No se encontraron templates
                    </div>
                ) : (
                    categories.map(category => {
                        const categoryTemplates = filteredTemplates.filter(t => t.category === category);
                        if (categoryTemplates.length === 0) return null;

                        return (
                            <React.Fragment key={category}>
                                <DropdownMenuLabel className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">
                                        {categoryIcons[category]}
                                    </span>
                                    {categoryLabels[category]}
                                </DropdownMenuLabel>
                                {categoryTemplates.map(template => (
                                    <DropdownMenuItem
                                        key={template.id}
                                        onClick={() => handleTemplateClick(template)}
                                        className="flex flex-col items-start gap-1 py-2"
                                    >
                                        <div className="font-medium text-sm">{template.title}</div>
                                        <div className="text-xs text-muted-foreground">{template.description}</div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                            </React.Fragment>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

