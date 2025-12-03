import React, { useState, useRef, useEffect, createContext, useContext, ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipContextType {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const TooltipContext = createContext<TooltipContextType | null>(null);
const useTooltip = () => {
    const context = useContext(TooltipContext);
    if (!context) throw new Error('useTooltip must be used within a Tooltip');
    return context;
};

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // In a real scenario, this provider would manage global state for tooltips,
    // like ensuring only one is open at a time. For this app, it's a simple wrapper.
    return <>{children}</>;
};

export const Tooltip: React.FC<{ children: ReactNode; openDelay?: number, closeDelay?: number }> = ({ children, openDelay = 100, closeDelay = 100 }) => {
    const [open, setOpen] = useState(false);
    const openTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerRef = useRef<HTMLElement>(null);

    const onOpen = () => {
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
        if (!open) openTimeout.current = setTimeout(() => setOpen(true), openDelay);
    };

    const onClose = () => {
        if (openTimeout.current) clearTimeout(openTimeout.current);
        closeTimeout.current = setTimeout(() => setOpen(false), closeDelay);
    };

    return (
        <TooltipContext.Provider value={{ open, onOpen, onClose, triggerRef }}>
            <div className="relative inline-block">{children}</div>
        </TooltipContext.Provider>
    );
};

export const TooltipTrigger = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { asChild?: boolean }>(
    ({ children, asChild, ...props }, ref) => {
        const { onOpen, onClose, triggerRef } = useTooltip();
        const child = asChild ? React.Children.only(children) : <div {...props}>{children}</div>;
        
        return React.cloneElement(child as React.ReactElement<any>, {
            ref: (node: HTMLElement | null) => {
                (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            },
            onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { props.onMouseEnter?.(e); onOpen(); },
            onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { props.onMouseLeave?.(e); onClose(); },
            onFocus: (e: React.FocusEvent<HTMLElement>) => { props.onFocus?.(e); onOpen(); },
            onBlur: (e: React.FocusEvent<HTMLElement>) => { props.onBlur?.(e); onClose(); },
        });
    }
);
TooltipTrigger.displayName = "TooltipTrigger";

export const TooltipContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }>(
    ({ className, sideOffset = 6, ...props }, ref) => {
        const { open, triggerRef } = useTooltip();
        
        const dynamicStyle: React.CSSProperties = { top: '100%', marginTop: `${sideOffset}px`};

        return (
            <AnimatePresence>
                {open && triggerRef.current && (
                    <motion.div
                        ref={ref}
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={cn(
                            "absolute left-1/2 -translate-x-1/2 z-50 overflow-hidden rounded-md bg-neutral-900 dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-50 shadow-md",
                            className
                        )}
                        style={dynamicStyle}
                        {...props}
                    />
                )}
            </AnimatePresence>
        );
    }
);
TooltipContent.displayName = "TooltipContent";
