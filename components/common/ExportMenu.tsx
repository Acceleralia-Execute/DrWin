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
import { exportConversation, ConversationMessage } from '../../lib/agent/utils/download';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';

interface ExportMenuProps {
    messages: ConversationMessage[];
    disabled?: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ messages, disabled = false }) => {
    const { t } = useLanguage();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'markdown' | 'pdf' | 'json' | 'docx') => {
        if (messages.length === 0) {
            toast.error('No hay mensajes para exportar');
            return;
        }

        setIsExporting(true);
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `conversacion-drwin-${timestamp}`;
            
            exportConversation(messages, format, filename);
            toast.success(`Conversación exportada como ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Error exporting conversation:', error);
            toast.error('Error al exportar la conversación');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={disabled || messages.length === 0 || isExporting}
                    className="h-8 w-8"
                    title="Exportar conversación"
                >
                    <span className="material-symbols-outlined text-base">
                        {isExporting ? 'hourglass_empty' : 'download'}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Exportar como</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('markdown')} disabled={isExporting}>
                    <span className="material-symbols-outlined mr-2 text-base">description</span>
                    Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
                    <span className="material-symbols-outlined mr-2 text-base">picture_as_pdf</span>
                    PDF (.pdf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} disabled={isExporting}>
                    <span className="material-symbols-outlined mr-2 text-base">code</span>
                    JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('docx')} disabled={isExporting}>
                    <span className="material-symbols-outlined mr-2 text-base">article</span>
                    Word (.docx)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

