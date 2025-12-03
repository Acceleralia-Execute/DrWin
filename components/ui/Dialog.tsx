
import React, { createContext, useContext, useRef, useEffect, ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  titleId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextType | null>(null);

const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) throw new Error('useDialog must be used within a Dialog');
    return context;
};

export const Dialog: React.FC<{ children: ReactNode, open: boolean, onOpenChange: (open: boolean) => void }> = ({ children, open, onOpenChange }) => {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <DialogContext.Provider value={{ open, onOpenChange, triggerRef, contentRef, titleId: 'dialog-title', descriptionId: 'dialog-description' }}>
            {children}
        </DialogContext.Provider>
    );
};

export const DialogTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => {
        const { onOpenChange, triggerRef } = useDialog();
        return (
            <button
                ref={(node) => {
                    triggerRef.current = node;
                    if(typeof ref === 'function') ref(node)
                    else if (ref) ref.current = node;
                }}
                {...props}
                onClick={(e) => {
                    props.onClick?.(e);
                    onOpenChange(true);
                }}
            />
        );
    }
);
DialogTrigger.displayName = "DialogTrigger";

const DialogOverlay = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-50 bg-black/50", className)}
            {...props}
        />
    )
);
DialogOverlay.displayName = "DialogOverlay";

export const DialogContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const { open, onOpenChange, contentRef, titleId, descriptionId } = useDialog();

        useEffect(() => {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onOpenChange(false);
            };
            if(open) document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }, [open, onOpenChange]);

        return (
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <DialogOverlay onClick={() => onOpenChange(false)} />
                        <motion.div
                            ref={(node) => {
                                contentRef.current = node;
                                if(typeof ref === 'function') ref(node)
                                else if (ref) ref.current = node;
                            }}
                            role="dialog"
                            aria-labelledby={titleId}
                            aria-describedby={descriptionId}
                            aria-modal="true"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "relative z-50 grid w-full max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg sm:max-w-md",
                                className
                            )}
                            {...props}
                        >
                            {children}
                             <button
                                onClick={() => onOpenChange(false)}
                                className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                <span className="material-symbols-outlined h-4 w-4">close</span>
                                <span className="sr-only">Close</span>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        );
    }
);
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);

export const DialogTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => {
        const { titleId } = useDialog();
        return <h2 ref={ref} id={titleId} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
    }
);
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => {
        const { descriptionId } = useDialog();
        return <p ref={ref} id={descriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />
    }
);
DialogDescription.displayName = "DialogDescription";
