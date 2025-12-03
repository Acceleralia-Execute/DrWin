import React from 'react';

interface SettingsRowProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({ title, description, children }) => {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="w-2/3 pr-8">
        <h4 className="font-medium text-card-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
};
