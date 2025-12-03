import React from 'react';
import { cn } from '../../lib/utils';

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  small?: boolean;
  children: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ selected, small, children, className, ...props }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium transition-colors cursor-pointer',
        small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        selected
          ? 'border-primary/50 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary/40'
          : 'border-border bg-transparent hover:bg-accent',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
