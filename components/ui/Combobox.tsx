import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Input } from './Input';

interface ComboboxProps {
  items: string[];
  placeholder?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({ items, placeholder, className }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    setOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredItems = value
    ? items.filter(item => item.toLowerCase().includes(value.toLowerCase()))
    : items;

  const showAddNewOption = value.length > 0 && !items.some(item => item.toLowerCase() === value.toLowerCase());

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!open) {
                setOpen(true);
            }
          }}
          onFocus={handleFocus}
          id="combobox"
          aria-expanded={open}
          aria-controls="combobox-options"
          aria-autocomplete="list"
          role="combobox"
          className="pr-10"
        />
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            id="combobox-options"
            role="listbox"
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto p-1"
          >
            <>
              {showAddNewOption && (
                  <li
                      className="px-3 py-2 text-sm cursor-pointer rounded-sm hover:bg-accent"
                      onClick={() => {
                          setValue(value);
                          setOpen(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                  >
                      <div className="flex items-center gap-2">
                         <span className="material-symbols-outlined text-tertiary-600 text-base">add_circle</span>
                         <span>Añadir: <span className="font-semibold truncate">{value}</span></span>
                      </div>
                  </li>
              )}
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <li
                    key={item}
                    role="option"
                    aria-selected={value === item}
                    className="px-3 py-2 text-sm cursor-pointer rounded-sm hover:bg-accent"
                    onClick={() => {
                      setValue(item);
                      setOpen(false);
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevents input blur on click
                  >
                    {item}
                  </li>
                ))
              ) : !showAddNewOption && (
                <li className="p-3 text-center text-sm text-muted-foreground">
                  No se encontraron resultados
                </li>
              )}
            </>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
