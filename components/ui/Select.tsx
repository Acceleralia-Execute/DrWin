import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface SelectContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  placeholder?: string;
  displayValue: ReactNode;
  setDisplayValue: (node: ReactNode) => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

const useSelect = () => {
    const context = useContext(SelectContext);
    if (!context) throw new Error('useSelect must be used within a Select component');
    return context;
};

export const Select: React.FC<{ children: ReactNode, value?: string, onValueChange?: (value: string) => void }> = ({ children, value, onValueChange }) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [displayValue, setDisplayValue] = useState<ReactNode>(null);

    useEffect(() => {
        // Find the child SelectItem that matches the value and set its children as the display value.
        // This handles the initial render case.
        let found = false;
        React.Children.forEach(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectContent) {
                 React.Children.forEach(child.props.children, (item) => {
                    if (React.isValidElement(item) && item.type === SelectItem && item.props.value === value) {
                        setDisplayValue(item.props.children);
                        found = true;
                    }
                });
            }
        });
        if (!found) {
            setDisplayValue(null);
        }
    }, [value, children]);

    return (
        <SelectContext.Provider value={{ open, setOpen, value, onValueChange, triggerRef, contentRef, displayValue, setDisplayValue }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
}

export const SelectTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
    const { open, setOpen, triggerRef, displayValue } = useSelect();
    
    return (
        <button
            ref={(node) => {
                triggerRef.current = node;
                if(typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            type="button"
            onClick={() => setOpen(!open)}
            className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
            {...props}
        >
            <span className="flex-1 text-left truncate">{displayValue || children}</span>
            <span className="material-symbols-outlined h-4 w-4 opacity-50">unfold_more</span>
        </button>
    );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const { displayValue } = useSelect();
    return <>{displayValue || <span className="text-muted-foreground">{placeholder}</span>}</>;
};

export const SelectContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => {
    const { open, setOpen, contentRef, triggerRef } = useSelect();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
                contentRef.current && !contentRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, setOpen, triggerRef, contentRef]);
    
    if (!open) return null;

    return (
        <div
            ref={(node) => {
                contentRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            className={cn("absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md", className)}
            {...props}
        >
            {children}
        </div>
    );
});
SelectContent.displayName = "SelectContent";

export const SelectItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
    ({ className, children, value, ...props }, ref) => {
        const { onValueChange, setOpen, value: selectedValue, setDisplayValue } = useSelect();
        const isSelected = selectedValue === value;
        
        return (
            <div
                ref={ref}
                className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
                onClick={() => {
                    onValueChange?.(value);
                    setDisplayValue(children);
                    setOpen(false);
                }}
                {...props}
            >
                 {isSelected && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                       <span className="material-symbols-outlined h-4 w-4">check</span>
                    </span>
                )}
                <span className="truncate">{children}</span>
            </div>
        );
    }
);
SelectItem.displayName = "SelectItem";