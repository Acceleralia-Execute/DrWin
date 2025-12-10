
import React, { useState, useRef, useEffect, createContext, useContext, ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownMenuContextType {
    open: boolean;
    setOpen: (open: boolean) => void;
    triggerRef: React.RefObject<HTMLButtonElement>;
    contentRef: React.RefObject<HTMLDivElement>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

const useDropdownMenu = () => {
    const context = useContext(DropdownMenuContext);
    if (!context) {
        throw new Error('useDropdownMenu must be used within a DropdownMenu');
    }
    return context;
}

export const DropdownMenu: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseDown = (event: MouseEvent) => {
            if (open &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                contentRef.current &&
                !contentRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [open]);

    return (
      <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
        <div className="relative inline-block text-left">
          {children}
        </div>
      </DropdownMenuContext.Provider>
    );
};

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
    ({ children, asChild = false, ...props }, ref) => {
        const { open, setOpen, triggerRef } = useDropdownMenu();
        
        const child = asChild ? React.Children.only(children) : <button type="button" {...props}>{children}</button>;

        return React.cloneElement(child as React.ReactElement<any>, {
            ...props,
            ref: (node: HTMLButtonElement | null) => {
                 (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                 if (typeof ref === 'function') ref(node);
                 else if (ref) ref.current = node;
            },
            onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                props.onClick?.(e);
                if (asChild) {
                    (child as React.ReactElement<any>).props.onClick?.(e);
                }
                setOpen(!open);
            },
            'aria-haspopup': 'menu',
            'aria-expanded': open,
        });
    }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export const DropdownMenuContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'center' | 'end', side?: 'top' | 'bottom', forceMount?: boolean }>(
    ({ className, align = 'end', side = 'bottom', forceMount, ...props }, ref) => {
        const { open, contentRef } = useDropdownMenu();
        
        const alignClasses = {
            start: side === 'top' ? 'origin-bottom-left left-0 bottom-full' : 'origin-top-left left-0 top-full',
            center: side === 'top' ? 'origin-bottom bottom-full left-1/2 -translate-x-1/2' : 'origin-top top-full left-1/2 -translate-x-1/2',
            end: side === 'top' ? 'origin-bottom-right right-0 bottom-full' : 'origin-top-right right-0 top-full'
        }
        
        const marginClass = side === 'top' ? 'mb-2' : 'mt-2';

        return (
             <AnimatePresence>
                {(open || forceMount) && (
                    <motion.div
                        ref={(node: HTMLDivElement | null) => {
                            (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
                            if (typeof ref === 'function') ref(node);
                            else if (ref) ref.current = node;
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 5 : -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 5 : -5 }}
                        transition={{ duration: 0.1 }}
                        className={cn(
                            "absolute z-[100] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                            marginClass,
                            alignClasses[align],
                            className
                        )}
                        {...props}
                    />
                )}
            </AnimatePresence>
        );
    }
);
DropdownMenuContent.displayName = "DropdownMenuContent"

export const DropdownMenuItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const { setOpen } = useDropdownMenu();
        return (
            <div
                ref={ref}
                onClick={(e) => {
                    props.onClick?.(e);
                    setOpen(false);
                }}
                className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
                {...props}
            />
        );
    }
);
DropdownMenuItem.displayName = "DropdownMenuItem"

export const DropdownMenuLabel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
    )
);
DropdownMenuLabel.displayName = "DropdownMenuLabel"

export const DropdownMenuSeparator = forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
    ({ className, ...props }, ref) => (
        <hr ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
    )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"
