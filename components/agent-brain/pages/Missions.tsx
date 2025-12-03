import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { DrWin } from '../DrWin';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../../context/SettingsContext';
import { Message, Attachment } from '../../../context/SettingsContext';
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

const SuggestionCard: React.FC<{ icon: string, title: string; description: string; onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 }, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' }}
    >
        <button
            className="w-full text-left p-4 bg-card rounded-xl border border-border cursor-pointer transition-shadow relative overflow-hidden group"
            onClick={onClick}
        >
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary">
                     <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div>
                    <h3 className="font-semibold text-card-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-muted-foreground text-lg">arrow_forward</span>
            </div>
        </button>
    </motion.div>
);


const Missions: React.FC = () => {
    const { t } = useLanguage();
    const { settings, updateSetting } = useSettings();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [view, setView] = useState<'chat' | 'tasks'>('chat');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | null>(null);

    const isTourActive = !settings.onboarding.hasCompleted;

    const priorities = [
        { level: 'Low', color: 'bg-blue-500', icon: 'keyboard_arrow_down' },
        { level: 'Medium', color: 'bg-yellow-500', icon: 'horizontal_rule' },
        { level: 'High', color: 'bg-red-500', icon: 'keyboard_arrow_up' },
    ];

    const currentPriority = useMemo(() => priorities.find(p => p.level === priority), [priority]);
    
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [settings.conversationHistory, view]);

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
                            setLoadingMessage(`Espera, que hablo con ${miniWin.name}...`);
                        } else {
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
        }
    };

    const handleSuggestionClick = (titleKey: string, descKey: string) => {
        const prompt = `${t(titleKey as any)}\n${t(descKey as any)}`;
        handleSend(prompt);
    };

    const tasks = useMemo(() => {
        const taskMessages = settings.conversationHistory.filter(msg => msg.priority);
        const grouped: { [key in 'High' | 'Medium' | 'Low']: Message[] } = { High: [], Medium: [], Low: [] };
        
        taskMessages.forEach(msg => {
            if (msg.priority) grouped[msg.priority].push(msg);
        });
        
        return [
            ...grouped['High'],
            ...grouped['Medium'],
            ...grouped['Low'],
        ];
    }, [settings.conversationHistory]);

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950">
            <header className="px-6 pt-6 bg-background flex-shrink-0">
                 <div className="flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-secondary-800 dark:text-neutral-200">{t('missions.title')}</h1>
                    <div className="flex items-center gap-1 p-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg">
                        <Button data-tour-id="chat-tab" size="sm" onClick={() => setView('chat')} variant={view === 'chat' ? 'secondary' : 'ghost'} className={cn("gap-1.5", view === 'chat' && 'bg-white dark:bg-neutral-950')}>
                            <span className="material-symbols-outlined text-base">chat</span> {t('missions.view.chat')}
                        </Button>
                        <Button data-tour-id="tasks-tab" size="sm" onClick={() => setView('tasks')} variant={view === 'tasks' ? 'secondary' : 'ghost'} className={cn("gap-1.5", view === 'tasks' && 'bg-white dark:bg-neutral-950')}>
                            <span className="material-symbols-outlined text-base">task_alt</span> {t('missions.view.tasks')}
                        </Button>
                    </div>
                 </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                {view === 'chat' && (
                    <>
                        {settings.conversationHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center pt-8">
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
                                {settings.conversationHistory.map((msg, index) => (
                                    <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                        {msg.role === 'model' && <DrWin className="w-8 h-8 flex-shrink-0 mt-1.5" />}
                                        <div className={cn(
                                            "p-3 rounded-lg prose prose-sm dark:prose-invert relative",
                                            msg.role === 'user' ? 'bg-primary text-white max-w-[80%]' : 'bg-card border border-border max-w-[90%]'
                                        )}>
                                            {msg.priority && (
                                                <div className={cn("absolute -top-2 -left-2 flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded-full text-white", priorities.find(p=>p.level===msg.priority)?.color)}>
                                                    <span className="material-symbols-outlined text-xs">{priorities.find(p=>p.level===msg.priority)?.icon}</span>
                                                    <span>{t(`missions.priority.${msg.priority.toLowerCase()}` as any)}</span>
                                                </div>
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
                                                                <div className={cn("w-full h-full flex flex-col items-center justify-center p-2", msg.role === 'user' ? 'bg-white/20 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-foreground')}>
                                                                    <span className="material-symbols-outlined text-3xl">description</span>
                                                                    <span className="text-xs text-center break-all truncate w-full">{att.name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <AnimatePresence>
                                {isLoading && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                                            <span>{loadingMessage || t('missions.chat.thinking')}</span>
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
                        {tasks.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-center pt-24">
                                <span className="material-symbols-outlined text-6xl text-muted-foreground">task_alt</span>
                                <h2 className="mt-4 text-xl font-semibold">{t('missions.tasks.empty.title')}</h2>
                                <p className="mt-2 text-muted-foreground">{t('missions.tasks.empty.desc')}</p>
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
                                            </h3>
                                            <div className="space-y-2">
                                                {priorityTasks.map(task => (
                                                     <div key={task.timestamp} className="p-3 bg-card border border-border rounded-md">
                                                        <p className="text-sm">{task.text}</p>
                                                     </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
                </motion.div>
                </AnimatePresence>
            </div>
            <div className="p-4 border-t border-border bg-background">
                <div className="max-w-4xl mx-auto">
                    {attachments.length > 0 && (
                        <div className="mb-2">
                            <div className="flex space-x-2 overflow-x-auto py-2">
                                {attachments.map((file, index) => (
                                    <div key={index} className="relative flex-shrink-0 w-20 h-20 bg-card border rounded-md overflow-hidden group">
                                        {file.type.startsWith('image/') ? (
                                            <img src={`data:${file.type};base64,${file.data}`} alt={file.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center bg-neutral-100 dark:bg-neutral-800 p-1">
                                                <span className="material-symbols-outlined text-3xl text-muted-foreground">description</span>
                                                <span className="text-xs text-muted-foreground truncate w-full px-1">{file.name}</span>
                                            </div>
                                        )}
                                        <button onClick={() => handleRemoveAttachment(index)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full flex items-center justify-center w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-sm leading-none">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                        <div className="relative flex items-end gap-2">
                             <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 h-11 w-11" onClick={handleNewChat}>
                                <span className="material-symbols-outlined text-base">add</span>
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="flex-shrink-0 h-11 w-11" onClick={() => fileInputRef.current?.click()}>
                                <span className="material-symbols-outlined text-base">attach_file</span>
                            </Button>
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png,image/jpeg,image/gif,application/pdf,.doc,.docx"
                            />
                            <div className="relative flex-1">
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
                                    className="w-full min-h-[44px] max-h-48 resize-none p-3 pr-24 rounded-lg border border-input focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button data-tour-id="priority-button" type="button" variant="ghost" size="icon" className="h-8 w-8">
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

                                    <Button data-tour-id="send-button" type="submit" size="icon" className="h-8 w-8 ml-1" disabled={isLoading || (!isTourActive && !input.trim() && attachments.length === 0)}>
                                        <span className="material-symbols-outlined text-base">arrow_upward</span>
                                    </Button>
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