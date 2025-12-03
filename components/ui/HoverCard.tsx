import React, { useState, useRef, useEffect, createContext, useContext, ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HoverCardContextType {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}

const HoverCardContext = createContext<HoverCardContextType | null>(null);

const useHoverCard = () => {
    const context = useContext(HoverCardContext);
    if (!context) throw new Error('useHoverCard must be used within a HoverCard');
    return context;
};

export const HoverCard: React.FC<{ children: ReactNode; openDelay?: number, closeDelay?: number }> = ({ children, openDelay = 200, closeDelay = 100 }) => {
    const [open, setOpen] = useState(false);
    const openTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const onOpen = () => {
        if (closeTimeout.current) {
            clearTimeout(closeTimeout.current);
            closeTimeout.current = null;
        }
        if (!open) {
            openTimeout.current = setTimeout(() => setOpen(true), openDelay);
        }
    };

    const onClose = () => {
        if (openTimeout.current) {
            clearTimeout(openTimeout.current);
            openTimeout.current = null;
        }
        closeTimeout.current = setTimeout(() => setOpen(false), closeDelay);
    };

    return (
        <HoverCardContext.Provider value={{ open, onOpen, onClose, triggerRef, contentRef }}>
            <div className="relative w-full h-full">{children}</div>
        </HoverCardContext.Provider>
    );
};

export const HoverCardTrigger = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & {asChild?: boolean}>(
    ({ children, asChild, ...props }, ref) => {
        const { onOpen, onClose, triggerRef } = useHoverCard();
        const child = asChild ? React.Children.only(children) : <div {...props}>{children}</div>;
        
        return React.cloneElement(child as React.ReactElement<any>, {
            ref: (node: HTMLElement | null) => {
                (triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
                if(typeof ref === 'function') ref(node)
                else if (ref) ref.current = node;
            },
            onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
                props.onPointerEnter?.(e);
                onOpen();
            },
            onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
                props.onPointerLeave?.(e);
                onClose();
            },
        });
    }
);
HoverCardTrigger.displayName = "HoverCardTrigger"

export const HoverCardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { side?: 'top' | 'bottom' | 'left' | 'right'; sideOffset?: number, align?: 'start' | 'center' | 'end' }>(
    ({ className, side = 'bottom', sideOffset = 8, align = 'center', ...props }, ref) => {
        const { open, contentRef, onClose, onOpen, triggerRef } = useHoverCard();
        const [contentWidth, setContentWidth] = useState<number | undefined>(undefined);

        useEffect(() => {
            if (open && triggerRef.current) {
                setContentWidth(triggerRef.current.offsetWidth);
            }
        }, [open, triggerRef]);
        
        const sideClasses = {
            top: 'bottom-full',
            bottom: 'top-full',
            left: 'right-full',
            right: 'left-full',
        };

        const alignClasses = {
            top: { start: 'left-0', center: 'left-1/2', end: 'right-0' },
            bottom: { start: 'left-0', center: 'left-1/2', end: 'right-0' },
            left: { start: 'top-0', center: 'top-1/2', end: 'bottom-0' },
            right: { start: 'top-0', center: 'top-1/2', end: 'bottom-0' },
        };
        
        const dynamicStyle: React.CSSProperties = {
            width: contentWidth ? `${contentWidth}px` : undefined,
        };
        if (side === 'top') dynamicStyle.marginBottom = `${sideOffset}px`;
        if (side === 'bottom') dynamicStyle.marginTop = `${sideOffset}px`;
        if (side === 'left') dynamicStyle.marginRight = `${sideOffset}px`;
        if (side === 'right') dynamicStyle.marginLeft = `${sideOffset}px`;
        
        const xAlignTransform = align === 'center' ? "-50%" : "0%";
        const yAlignTransform = align === 'center' ? "-50%" : "0%";

        const animationVariants = {
          top: { initial: { opacity: 0, y: 8, scale: 0.98, x: xAlignTransform }, animate: { opacity: 1, y: 0, scale: 1, x: xAlignTransform }, exit: { opacity: 0, y: 8, scale: 0.98, x: xAlignTransform } },
          bottom: { initial: { opacity: 0, y: -8, scale: 0.98, x: xAlignTransform }, animate: { opacity: 1, y: 0, scale: 1, x: xAlignTransform }, exit: { opacity: 0, y: -8, scale: 0.98, x: xAlignTransform } },
          left: { initial: { opacity: 0, x: 8, scale: 0.98, y: yAlignTransform }, animate: { opacity: 1, x: 0, scale: 1, y: yAlignTransform }, exit: { opacity: 0, x: 8, scale: 0.98, y: yAlignTransform } },
          right: { initial: { opacity: 0, x: -8, scale: 0.98, y: yAlignTransform }, animate: { opacity: 1, x: 0, scale: 1, y: yAlignTransform }, exit: { opacity: 0, x: -8, scale: 0.98, y: yAlignTransform } },
        };
        
        const currentAnimation = animationVariants[side];

        return (
            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={(node) => {
                            if (node) {
                                contentRef.current = node;
                                if (typeof ref === 'function') ref(node);
                                else if (ref) ref.current = node;
                            }
                        }}
                        initial={currentAnimation.initial}
                        animate={currentAnimation.animate}
                        exit={currentAnimation.exit}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onPointerEnter={onOpen}
                        onPointerLeave={onClose}
                        className={cn(
                            "absolute z-50 rounded-md border bg-popover p-3 text-popover-foreground shadow-md outline-none",
                             sideClasses[side],
                             alignClasses[side][align],
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
HoverCardContent.displayName = "HoverCardContent"
