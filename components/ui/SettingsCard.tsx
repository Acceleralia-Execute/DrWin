import React from 'react';
import { cn } from '../../lib/utils';

interface SettingsCardProps {
  title?: string;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ title, children, noPadding = false }) => {
  return (
    <div className="border border-border rounded-lg bg-card">
      {title && <div className="p-4 border-b border-border bg-neutral-50 dark:bg-neutral-900/50">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
      </div>}
      <div className={cn(!noPadding && 'divide-y divide-border')}>
        {children}
      </div>
    </div>
  );
};
