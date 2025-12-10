
import React from 'react';
import { cn } from '../../lib/utils';
import { DrWin } from './DrWin';
import { useLanguage } from '../../hooks/useLanguage';
import { useSettings } from '../../context/SettingsContext';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { t } = useLanguage();
  const { settings } = useSettings();

  const memoriaBaseItems = [
    { id: 'missions', label: t('sidebar.item.missions'), icon: 'home', tourId: 'sidebar-home' },
    { id: 'unified_profile', label: t('sidebar.item.cognitive_profile'), icon: 'account_balance', tourId: 'sidebar-profile' },
    { id: 'statistics', label: 'Estadísticas', icon: 'analytics', tourId: 'sidebar-statistics' },
  ];
  
  const configuracionOperacionItems = [
    { id: 'configuration', label: t('sidebar.item.configuration'), icon: 'settings', tourId: 'sidebar-config' },
  ];

  const isConfigPage = ['general', 'personalization', 'notifications', 'connectors', 'context_hub', 'data_controls', 'security'].includes(currentPage);
  const activePage = isConfigPage ? 'configuration' : currentPage;

  const renderSection = (titleKey: string, items: typeof memoriaBaseItems) => (
    <div>
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t(titleKey as any)}</h3>
        <div className="space-y-1">
        {items.map(item => (
            <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            data-tour-id={item.tourId}
            className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                activePage === item.id 
                ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 dark:from-primary-900/50 dark:to-primary-800/30 dark:text-primary-300 shadow-sm'
                : 'text-secondary-700 dark:text-neutral-300 hover:bg-gradient-to-r hover:from-neutral-200/50 hover:to-neutral-100/50 dark:hover:from-neutral-800/50 dark:hover:to-neutral-700/30 hover:shadow-sm'
            )}
            >
            <span className="material-symbols-outlined text-base">{item.icon}</span>
            <span>{item.label}</span>
            </button>
        ))}
        </div>
    </div>
  );

  return (
    <aside className="w-64 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300 shadow-lg relative">
      {/* Efecto glassmorphism con overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent dark:from-neutral-800/50 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-14 h-14">
                  <DrWin />
              </div>
              <div>
                  <h2 className="font-bold text-lg text-secondary dark:text-neutral-200">Dr. Win</h2>
                  <p className="text-xs text-muted-foreground">{t('sidebar.subtitle')}</p>
              </div>
          </div>
        </div>
        <nav className="flex-grow p-4 space-y-6">
          {renderSection('sidebar.section.memoria_base', memoriaBaseItems)}
          {renderSection('sidebar.section.configuracion_operacion', configuracionOperacionItems)}
        </nav>

        <div className="p-4 border-t border-border/50">
           <div className="flex items-center justify-between bg-background/60 dark:bg-background/40 backdrop-blur-sm rounded-lg p-2 border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                   <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0 text-white shadow-sm">
                      {settings.account.name ? settings.account.name.substring(0, 2).toUpperCase() : 'U'}
                   </div>
                   <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate text-foreground">{settings.account.name || 'User'}</span>
                      <span className="text-[10px] text-muted-foreground truncate">Free Plan</span>
                   </div>
              </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
