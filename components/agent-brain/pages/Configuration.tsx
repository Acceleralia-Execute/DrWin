import React, { useState, Suspense, lazy } from 'react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../hooks/useLanguage';

const General = lazy(() => import('./General'));
const Personalization = lazy(() => import('./Personalization'));
const Notifications = lazy(() => import('./Notifications'));
const Connectors = lazy(() => import('./Connectors'));
const DataControls = lazy(() => import('./DataControls'));
const Security = lazy(() => import('./Security'));

const LoadingComponent: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);


const Configuration: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: t('page_config.tab.general'), icon: 'tune', component: General },
        { id: 'personalization', label: t('page_config.tab.personalization'), icon: 'palette', component: Personalization },
        { id: 'notifications', label: t('page_config.tab.notifications'), icon: 'notifications', component: Notifications },
        { id: 'connectors', label: t('page_config.tab.connectors'), icon: 'power', component: Connectors },
        { id: 'data_controls', label: t('page_config.tab.data_controls'), icon: 'security', component: DataControls },
        { id: 'security', label: t('page_config.tab.security'), icon: 'lock', component: Security }
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

    return (
        <div className="flex flex-col h-full">
            <header className="p-8 pb-0">
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_config.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('page_config.subtitle')}</p>
            </header>
            <div className="px-8 mt-6 border-b border-border">
                <nav className="flex space-x-2 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-md transition-colors whitespace-nowrap',
                                activeTab === tab.id
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary"
                                    layoutId="underline"
                                />
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                         <Suspense fallback={<LoadingComponent />}>
                            {ActiveComponent && <ActiveComponent />}
                        </Suspense>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
};

export default Configuration;