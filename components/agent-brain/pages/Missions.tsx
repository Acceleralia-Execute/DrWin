import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { DrWin } from '../DrWin';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../../context/SettingsContext';
import { Message, Attachment } from '../../../context/SettingsContext';
import { useTheme } from '../../../context/ThemeContext';
import ExploraIcon from '../../../assets/ExploraIcon';
import PonderIcon from '../../../assets/PonderIcon';
import InventaIcon from '../../../assets/InventaIcon';
import TranscriptoIcon from '../../../assets/TranscriptoIcon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '../../ui/DropdownMenu';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processMessage } from '../../../lib/agent/agent';
import { downloadMarkdown, downloadJSON } from '../../../lib/agent/utils/download';
import { ExportMenu } from '../../common/ExportMenu';
import { TemplateSelector } from '../../common/TemplateSelector';
import { PromptTemplate } from '../../../lib/templates/promptTemplates';
import { TaskFilters, TaskFilter } from '../../common/TaskFilters';
import { searchConversations, ConversationFilter } from '../../../lib/utils/searchConversations';

const SuggestionCard: React.FC<{ icon: string, title: string; description: string; onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
        className="relative"
    >
        <button
            className="w-full text-left p-4 rounded-xl border border-border cursor-pointer transition-all duration-300 relative overflow-hidden group bg-gradient-to-br from-card via-card to-primary/5 dark:to-primary/10 shadow-sm hover:shadow-lg hover:border-primary/30"
            onClick={onClick}
        >
            {/* Gradiente de fondo animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative flex items-start gap-4">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 text-primary shadow-sm group-hover:shadow-md transition-shadow">
                     <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                <span className="material-symbols-outlined text-primary text-lg">arrow_forward</span>
            </div>
        </button>
    </motion.div>
);


const Missions: React.FC = () => {
    const { t } = useLanguage();
    const { settings, updateSetting } = useSettings();
    const { theme } = useTheme();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [currentMiniWin, setCurrentMiniWin] = useState<{ name: string; module: string } | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [view, setView] = useState<'chat' | 'tasks'>('chat');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | null>(null);
    const [taskFilters, setTaskFilters] = useState<TaskFilter>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFilter, setSearchFilter] = useState<ConversationFilter>({});

    const isTourActive = !settings.onboarding.hasCompleted;

    const priorities = [
        { level: 'Low', color: 'bg-blue-500', icon: 'keyboard_arrow_down' },
        { level: 'Medium', color: 'bg-yellow-500', icon: 'horizontal_rule' },
        { level: 'High', color: 'bg-red-500', icon: 'keyboard_arrow_up' },
    ];

    const currentPriority = useMemo(() => priorities.find(p => p.level === priority), [priority]);
    
    useEffect(() => {
        // Hacer scroll hacia abajo cuando hay nuevos mensajes
        if (messagesContainerRef.current && view === 'chat' && settings.conversationHistory.length > 0) {
            // Usar un pequeño delay para asegurar que el DOM se haya actualizado completamente
            const timeoutId = setTimeout(() => {
                if (messagesContainerRef.current) {
                    const container = messagesContainerRef.current;
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
            
            return () => clearTimeout(timeoutId);
        }
    }, [settings.conversationHistory.length, view]);

     useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleNewChat = () => {
        updateSetting('conversationHistory', []);
    }

    const handleStartTour = () => {
        updateSetting('onboarding.hasCompleted', false);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        
        const supportedTypes = [
            'image/png', 
            'image/jpeg', 
            'image/gif',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword' // .doc
        ];

        const filePromises = files.map((file: File) => {
            return new Promise<Attachment | null>((resolve, reject) => {
                if (!supportedTypes.includes(file.type)) {
                    toast.error(`Tipo de archivo no soportado: ${file.name}. Se aceptan imágenes, PDFs y documentos Word.`);
                    resolve(null);
                    return;
                }
    
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    const base64String = (loadEvent.target?.result as string).split(',')[1];
                    if (base64String) {
                        resolve({
                            name: file.name,
                            type: file.type,
                            data: base64String
                        });
                    } else {
                        reject(new Error(`Failed to read file: ${file.name}`));
                    }
                };
                reader.onerror = (error) => {
                    reject(error);
                };
                reader.readAsDataURL(file);
            });
        });
    
        Promise.all(filePromises)
            .then(results => {
                const validAttachments = results.filter((r): r is Attachment => r !== null);
                setAttachments(prev => [...prev, ...validAttachments]);
                if (validAttachments.length > 0) {
                    toast.success(`${validAttachments.length} archivo(s) agregado(s)`);
                }
            })
            .catch(error => {
                console.error("Error reading files:", error);
                toast.error("Ocurrió un error al agregar archivos.");
            });
    
        e.target.value = '';
    };

    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSend = async (prompt?: string) => {
        const userMessageContent = prompt || input;
        if (!userMessageContent.trim() && attachments.length === 0) return;

        const userMessage: Message = {
            role: 'user',
            text: userMessageContent,
            timestamp: new Date().toISOString(),
            priority: priority,
            attachments: attachments,
        };

        setInput('');
        setPriority(null);
        const currentAttachments = [...attachments];
        setAttachments([]);

        const historyWithUserMessage = [...settings.conversationHistory, userMessage];
        updateSetting('conversationHistory', historyWithUserMessage);
        setIsLoading(true);

        try {
            // Convertir historial al formato del agente
            const agentHistory = settings.conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.text || '',
                attachments: msg.attachments || []
            }));

            // Preparar attachments para el agente
            const agentAttachments = currentAttachments.map(att => ({
                name: att.name,
                type: att.type,
                data: att.data
            }));

            // Procesar mensaje con el agente
            const result = await processMessage(
                userMessageContent,
                agentAttachments,
                agentHistory,
                (toolCalls) => {
                    // Cuando se detectan tool calls, mostrar mensaje de carga con el MiniWin
                    if (toolCalls.length > 0) {
                        const miniWin = toolCalls[0].miniWin;
                        if (miniWin) {
                            setCurrentMiniWin(miniWin);
                            setLoadingMessage(`Espera, que hablo con ${miniWin.name}...`);
                        } else {
                            setCurrentMiniWin(null);
                            setLoadingMessage('Procesando...');
                        }
                    }
                }
            );

            const modelMessage: Message = {
                role: 'model',
                text: result.response,
                timestamp: new Date().toISOString(),
                priority: null,
                toolCalls: result.toolCalls,
            };
            
            updateSetting('conversationHistory', [...historyWithUserMessage, modelMessage]);
            
            if (result.toolCalls && result.toolCalls.length > 0) {
                toast.success(`Ejecutadas ${result.toolCalls.length} herramienta(s)`);
            }
        } catch (error: any) {
            console.error("Agent error:", error);
            const errorMessage: Message = {
                role: 'model',
                text: `Lo siento, ocurrió un error: ${error.message}. Por favor, intenta de nuevo.`,
                timestamp: new Date().toISOString(),
                priority: null,
            };
            updateSetting('conversationHistory', [...historyWithUserMessage, errorMessage]);
            toast.error("Error al procesar el mensaje");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setCurrentMiniWin(null);
        }
    };

    const handleSuggestionClick = (titleKey: string, descKey: string) => {
        const prompt = `${t(titleKey as any)}\n${t(descKey as any)}`;
        handleSend(prompt);
    };

    const handleTemplateSelect = (template: PromptTemplate) => {
        handleSend(template.prompt);
    };

    const tasks = useMemo(() => {
        let taskMessages = settings.conversationHistory.filter(msg => msg.priority);
        
        // Aplicar filtros
        if (taskFilters.priority) {
            taskMessages = taskMessages.filter(msg => msg.priority === taskFilters.priority);
        }
        
        if (taskFilters.search) {
            const searchLower = taskFilters.search.toLowerCase();
            taskMessages = taskMessages.filter(msg => 
                msg.text?.toLowerCase().includes(searchLower)
            );
        }
        
        if (taskFilters.dateFrom) {
            taskMessages = taskMessages.filter(msg => {
                const msgDate = new Date(msg.timestamp);
                return msgDate >= taskFilters.dateFrom!;
            });
        }
        
        if (taskFilters.dateTo) {
            taskMessages = taskMessages.filter(msg => {
                const msgDate = new Date(msg.timestamp);
                return msgDate <= taskFilters.dateTo!;
            });
        }
        
        const grouped: { [key in 'High' | 'Medium' | 'Low']: Message[] } = { High: [], Medium: [], Low: [] };
        
        taskMessages.forEach(msg => {
            if (msg.priority) grouped[msg.priority].push(msg);
        });
        
        return [
            ...grouped['High'],
            ...grouped['Medium'],
            ...grouped['Low'],
        ];
    }, [settings.conversationHistory, taskFilters]);

    // Función para obtener el icono del MiniWin basado en el módulo
    const getMiniWinIcon = (module: string) => {
        const iconProps = { className: "w-12 h-12" };
        switch(module) {
            case 'Find': return <ExploraIcon {...iconProps} />;
            case 'Validate': return <PonderIcon {...iconProps} />;
            case 'Create': return <InventaIcon {...iconProps} />;
            case 'Readapt': return <TranscriptoIcon {...iconProps} />;
            default: return <DrWin {...iconProps} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
            {/* Gradiente de fondo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 dark:from-primary/10 dark:via-transparent dark:to-secondary/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 dark:bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <header className="px-6 pt-6 pb-4 bg-background/80 backdrop-blur-sm flex-shrink-0 relative z-10 border-b border-border/50">
                 <div className="flex justify-between items-center gap-4">
                    <h1 className="text-lg font-semibold text-secondary-800 dark:text-neutral-200">Dr. Win</h1>
                    <div className="flex items-center gap-2">
                        {view === 'chat' && settings.conversationHistory.length > 0 && (
                            <>
                                <div className="flex-1 relative max-w-xs">
                                    <input
                                        type="text"
                                        placeholder="Buscar en conversación..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setSearchFilter({ ...searchFilter, search: e.target.value });
                                        }}
                                        className="w-full px-3 py-1.5 pl-9 text-sm border border-border/50 rounded-lg bg-background/80 dark:bg-background/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                                    />
                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
                                        search
                                    </span>
                                </div>
                                <ExportMenu messages={settings.conversationHistory.map(msg => ({
                                    role: msg.role,
                                    text: msg.text || '',
                                    timestamp: msg.timestamp,
                                    priority: msg.priority || undefined
                                }))} />
                            </>
                        )}
                        <div className="flex items-center gap-1 p-1 bg-neutral-200/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                            <Button data-tour-id="chat-tab" size="sm" onClick={() => setView('chat')} variant={view === 'chat' ? 'secondary' : 'ghost'} className={cn("gap-1.5 transition-all duration-200", view === 'chat' && 'bg-white dark:bg-neutral-950 shadow-sm hover:shadow-md')}>
                                <span className="material-symbols-outlined text-base">chat</span> {t('missions.view.chat')}
                            </Button>
                            <Button data-tour-id="tasks-tab" size="sm" onClick={() => setView('tasks')} variant={view === 'tasks' ? 'secondary' : 'ghost'} className={cn("gap-1.5 transition-all duration-200", view === 'tasks' && 'bg-white dark:bg-neutral-950 shadow-sm hover:shadow-md')}>
                                <span className="material-symbols-outlined text-base">task_alt</span> {t('missions.view.tasks')}
                            </Button>
                        </div>
                    </div>
                 </div>
            </header>
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 relative z-0 max-w-5xl mx-auto w-full">
                <AnimatePresence mode="wait">
                                <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                {view === 'chat' && (
                    <>
                        {settings.conversationHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center pt-8 relative">
                                <DrWin className="w-28 h-28 mb-4" />
                                <h1 className="text-2xl font-bold text-secondary dark:text-neutral-200">{t('missions.chat.welcome')}</h1>
                                <Button variant="ghost" size="sm" className="mt-4 gap-1.5" onClick={handleStartTour}>
                                    <span className="material-symbols-outlined text-base">school</span>
                                    {t('missions.start_tutorial')}
                                </Button>
                                
                                <div className="mt-8 w-full mx-auto text-left">
                                    <p className="text-center text-sm font-semibold text-muted-foreground mb-4">{t('missions.suggestions.title')}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                                        <SuggestionCard icon="travel_explore" title={t('missions.suggestions.find.s1.title')} description={t('missions.suggestions.find.s1.desc')} onClick={() => handleSuggestionClick('missions.suggestions.find.s1.title', 'missions.suggestions.find.s1.desc')} />
                                        <SuggestionCard icon="compare_arrows" title={t('missions.suggestions.find.s2.title')} description={t('missions.suggestions.find.s2.desc')} onClick={() => handleSuggestionClick('missions.suggestions.find.s2.title', 'missions.suggestions.find.s2.desc')} />
                                        <SuggestionCard icon="playlist_add_check" title={t('missions.suggestions.validate.s1.title')} description={t('missions.suggestions.validate.s1.desc')} onClick={() => handleSuggestionClick('missions.suggestions.validate.s1.title', 'missions.suggestions.validate.s1.desc')} />
                                        <SuggestionCard icon="rule" title={t('missions.suggestions.validate.s2.title')} description={t('missions.suggestions.validate.s2.desc')} onClick={() => handleSuggestionClick('missions.suggestions.validate.s2.title', 'missions.suggestions.validate.s2.desc')} />
                                        <SuggestionCard icon="edit_document" title={t('missions.suggestions.create.s1.title')} description={t('missions.suggestions.create.s1.desc')} onClick={() => handleSuggestionClick('missions.suggestions.create.s1.title', 'missions.suggestions.create.s1.desc')} />
                                        <SuggestionCard icon="rate_review" title={t('missions.suggestions.create.s2.title')} description={t('missions.suggestions.create.s2.desc')} onClick={() => handleSuggestionClick('missions.suggestions.create.s2.title', 'missions.suggestions.create.s2.desc')} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {(searchQuery.trim() ? searchConversations(settings.conversationHistory, searchFilter) : settings.conversationHistory).map((msg, index) => (
                                        <motion.div 
                                            key={index} 
                                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}
                                        >
                                            {msg.role === 'model' && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: index * 0.05 + 0.1, type: "spring", stiffness: 200 }}
                                                    className="flex-shrink-0"
                                                >
                                                    <DrWin className="w-8 h-8 mt-1.5" />
                                                </motion.div>
                                            )}
                                            <motion.div 
                                                whileHover={{ scale: 1.01 }}
                                                className={cn(
                                                    "p-4 rounded-lg prose prose-sm dark:prose-invert relative transition-all duration-200 break-words",
                                                    msg.role === 'user' 
                                                        ? 'max-w-[75%] shadow-sm hover:shadow-md' 
                                                        : 'bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 max-w-[85%] shadow-sm hover:shadow-md'
                                                )}
                                                style={msg.role === 'user' ? {
                                                    background: theme === 'dark' 
                                                        ? 'linear-gradient(135deg, #2c1526 0%, #3d1f35 100%)' 
                                                        : 'linear-gradient(135deg, #f7cfe6 0%, #f0d9e8 100%)',
                                                    color: theme === 'dark' ? '#f7cfe6' : '#1a1a1a'
                                                } : undefined}
                                            >
                                                {msg.priority && (
                                                    <motion.div 
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                                        className={cn("absolute -top-2 -left-2 flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full text-white shadow-md", priorities.find(p=>p.level===msg.priority)?.color)}
                                                    >
                                                        <span className="material-symbols-outlined text-xs">{priorities.find(p=>p.level===msg.priority)?.icon}</span>
                                                        <span>{t(`missions.priority.${msg.priority.toLowerCase()}` as any)}</span>
                                                    </motion.div>
                                                )}
                                                {msg.role === 'model' && msg.text && (
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => {
                                                                    const timestamp = new Date().toISOString().split('T')[0];
                                                                    downloadMarkdown(msg.text || '', `respuesta-${timestamp}.md`);
                                                                    toast.success('Documento descargado');
                                                                }}
                                                                title="Descargar como Markdown"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">download</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                {msg.text && (
                                                    <div className="markdown-content group">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            components={{
                                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                                h1: ({ children }) => <h1 className="text-2xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                                                                h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                                                                h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
                                                                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                                                li: ({ children }) => <li className="ml-2">{children}</li>,
                                                                code: ({ children, className }) => {
                                                                    const isInline = !className;
                                                                    return isInline ? (
                                                                        <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                                                                    ) : (
                                                                        <code className="block bg-black/10 dark:bg-white/10 p-2 rounded text-sm font-mono overflow-x-auto">{children}</code>
                                                                    );
                                                                },
                                                                pre: ({ children }) => <pre className="bg-black/10 dark:bg-white/10 p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
                                                                blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic my-2">{children}</blockquote>,
                                                                table: ({ children }) => <table className="border-collapse border border-border my-2 w-full">{children}</table>,
                                                                th: ({ children }) => <th className="border border-border px-2 py-1 bg-muted font-semibold">{children}</th>,
                                                                td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
                                                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>,
                                                            }}
                                                        >
                                                            {msg.text}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className={cn("mt-2 flex flex-wrap gap-2", !msg.text && "mt-0")}>
                                                        {msg.attachments.map((att, idx) => (
                                                            <div key={idx} className="w-24 h-24 rounded-md overflow-hidden border border-black/10">
                                                                {att.type.startsWith('image/') ? (
                                                                    <img src={`data:${att.type};base64,${att.data}`} alt={att.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className={cn("w-full h-full flex flex-col items-center justify-center p-2", msg.role === 'user' ? 'bg-white/20 text-foreground' : 'bg-neutral-100 dark:bg-neutral-800 text-foreground')}>
                                                                        <span className="material-symbols-outlined text-3xl">description</span>
                                                                        <span className="text-xs text-center break-all truncate w-full">{att.name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </motion.div>
                                    ))}
                                </div>
                                <AnimatePresence>
                                {isLoading && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-3 py-4">
                                            {/* Animación de comunicación entre DrWin y MiniWin */}
                                            {currentMiniWin && (
                                                <div className="flex items-center justify-center gap-3">
                                                    {/* Icono de DrWin */}
                                                    <motion.div
                                                        animate={{ 
                                                            scale: [1, 1.1, 1],
                                                            opacity: [0.7, 1, 0.7]
                                                        }}
                                                        transition={{ 
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            ease: "easeInOut"
                                                        }}
                                                    >
                                                        <DrWin className="w-12 h-12" />
                                                    </motion.div>
                                                    
                                                    {/* Línea animada de comunicación */}
                                                    <motion.div
                                                        className="w-16 h-0.5 bg-primary-400/30 relative overflow-hidden rounded-full"
                                                        initial={{ scaleX: 0 }}
                                                        animate={{ scaleX: 1 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <motion.div
                                                            className="absolute top-0 left-0 w-3 h-3 bg-primary-400 rounded-full -mt-1"
                                                            animate={{ 
                                                                x: [0, 60, 0],
                                                            }}
                                                            transition={{ 
                                                                duration: 1.5,
                                                                repeat: Infinity,
                                                                ease: "easeInOut"
                                                            }}
                                                        />
                                                    </motion.div>
                                                    
                                                    {/* Icono del MiniWin */}
                                                    <motion.div
                                                        animate={{ 
                                                            scale: [1, 1.1, 1],
                                                            opacity: [0.7, 1, 0.7]
                                                        }}
                                                        transition={{ 
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            ease: "easeInOut",
                                                            delay: 0.75
                                                        }}
                                                    >
                                                        {getMiniWinIcon(currentMiniWin.module)}
                                                    </motion.div>
                                                </div>
                                            )}
                                            
                                            {/* Mensaje de carga */}
                                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                <div className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                                                <span>{loadingMessage || t('missions.chat.thinking')}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                                <div ref={scrollRef} />
                            </>
                        )}
                    </>
                )}

                {view === 'tasks' && (
                    <div>
                        {tasks.length === 0 && !taskFilters.priority && !taskFilters.search ? (
                             <div className="flex flex-col items-center justify-center h-full text-center pt-24">
                                <span className="material-symbols-outlined text-6xl text-muted-foreground">task_alt</span>
                                <h2 className="mt-4 text-xl font-semibold">{t('missions.tasks.empty.title')}</h2>
                                <p className="mt-2 text-muted-foreground">{t('missions.tasks.empty.desc')}</p>
                             </div>
                        ) : (
                            <>
                                <TaskFilters 
                                    filters={taskFilters} 
                                    onFiltersChange={setTaskFilters}
                                    taskCount={tasks.length}
                                />
                                {tasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center pt-12">
                                        <span className="material-symbols-outlined text-4xl text-muted-foreground mb-2">filter_alt_off</span>
                                        <p className="text-muted-foreground">No se encontraron tareas con los filtros aplicados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {priorities.map(p => {
                                            const priorityTasks = tasks.filter(task => task.priority === p.level);
                                            if (priorityTasks.length === 0) return null;
                                            return (
                                                <div key={p.level}>
                                                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                                                        <span className={cn("w-2 h-2 rounded-full", p.color)}></span>
                                                        {t(`missions.priority.${p.level.toLowerCase()}` as any)}
                                                        <span className="text-xs text-muted-foreground">({priorityTasks.length})</span>
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {priorityTasks.map((task, idx) => (
                                                             <motion.div 
                                                                key={task.timestamp} 
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: idx * 0.05 }}
                                                                className="p-3 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-md shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="text-sm flex-1">{task.text}</p>
                                                                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        {new Date(task.timestamp).toLocaleDateString('es-ES', { 
                                                                            day: '2-digit', 
                                                                            month: 'short',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                             </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                </motion.div>
                </AnimatePresence>
            </div>
            <div className="p-4 border-t border-border/50 bg-background/80 dark:bg-background/60 backdrop-blur-xl relative z-10">
                <div className="max-w-4xl mx-auto">
                    {attachments.length > 0 && (
                        <div className="mb-3">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {attachments.map((file, index) => (
                                    <motion.div 
                                        key={index} 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative flex-shrink-0 w-24 h-24 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105"
                                    >
                                        {file.type.startsWith('image/') ? (
                                            <img src={`data:${file.type};base64,${file.data}`} alt={file.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center bg-neutral-100 dark:bg-neutral-800 p-2">
                                                <span className="material-symbols-outlined text-2xl text-muted-foreground">description</span>
                                                <span className="text-xs text-muted-foreground truncate w-full mt-1">{file.name}</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleRemoveAttachment(index)} 
                                            className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center w-6 h-6 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            title="Eliminar archivo"
                                        >
                                            <span className="material-symbols-outlined text-sm leading-none">close</span>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                        <div className="flex items-center gap-2 bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30">
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="flex-shrink-0 h-10 w-10 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                                            onClick={handleNewChat}
                                            title="Nuevo chat"
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                        </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="icon" 
                                            className="flex-shrink-0 h-10 w-10 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200" 
                                            onClick={() => fileInputRef.current?.click()}
                                            title="Adjuntar archivo"
                                        >
                                            <span className="material-symbols-outlined text-lg">attach_file</span>
                                        </Button>
                                    </motion.div>
                                    <TemplateSelector onSelect={handleTemplateSelect} disabled={isLoading} />
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png,image/jpeg,image/gif,application/pdf,.doc,.docx"
                            />
                            <div className="relative flex-1 min-w-0">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={t('missions.chat.placeholder')}
                                    disabled={isLoading}
                                    rows={1}
                                    data-tour-id="chat-input"
                                    className="w-full min-h-[40px] max-h-48 resize-none py-2.5 px-3 pr-20 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm placeholder:text-muted-foreground/60"
                                    style={{ lineHeight: '1.5' }}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                data-tour-id="priority-button" 
                                                type="button" 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                                title="Prioridad"
                                            >
                                                <span className={cn("material-symbols-outlined text-base", currentPriority ? 'text-primary' : 'text-muted-foreground')}>
                                                    {currentPriority ? 'flag' : 'outlined_flag'}
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent data-tour-id="priority-menu" className="w-40 mb-2" align="end">
                                            {priorities.map((p) => (
                                                <div
                                                    key={p.level}
                                                    data-tour-id={`priority-option-${p.level.toLowerCase()}`}
                                                    className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                                                    onClick={() => setPriority(p.level as any)}
                                                >
                                                    <span className={cn("material-symbols-outlined text-base", priority === p.level && 'text-primary')}>{p.icon}</span>
                                                    <span>{t(`missions.priority.${p.level.toLowerCase()}` as any)}</span>
                                                </div>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <motion.div 
                                        whileHover={!isLoading && (isTourActive || input.trim() || attachments.length > 0) ? { scale: 1.1 } : {}}
                                        whileTap={!isLoading && (isTourActive || input.trim() || attachments.length > 0) ? { scale: 0.95 } : {}}
                                    >
                                        <Button 
                                            data-tour-id="send-button" 
                                            type="submit" 
                                            size="icon" 
                                            className={cn(
                                                "h-8 w-8 rounded-lg transition-all duration-200",
                                                isLoading || (!isTourActive && !input.trim() && attachments.length === 0)
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                    : "bg-gradient-to-br from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md hover:shadow-lg"
                                            )}
                                            disabled={isLoading || (!isTourActive && !input.trim() && attachments.length === 0)}
                                            title="Enviar mensaje"
                                        >
                                            <span className="material-symbols-outlined text-base">arrow_upward</span>
                                        </Button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Missions;