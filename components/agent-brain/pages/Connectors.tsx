
import React, { useState } from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { cn } from '../../../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/Tooltip';
import { useSettings } from '../../../context/SettingsContext';
import { toast } from 'sonner';
import { useLanguage } from '../../../hooks/useLanguage';

interface Connector {
    name: string;
    description: string;
    logo: string;
    capabilities: ('Chat' | 'Deep Dive' | 'Agent Mode')[];
}

const connectors: Connector[] = [
    { 
        name: 'WhatsApp', 
        description: 'Send and receive messages directly from your business number.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2044px-WhatsApp.svg.png', 
        capabilities: ['Chat', 'Agent Mode'] 
    },
    { 
        name: 'Slack', 
        description: 'Collaborate with your team, receive alerts, and manage projects in channels.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png', 
        capabilities: ['Chat', 'Deep Dive', 'Agent Mode'] 
    },
    { 
        name: 'Gmail', 
        description: 'Draft replies, organize your inbox, and schedule emails automatically.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png', 
        capabilities: ['Chat', 'Deep Dive', 'Agent Mode'] 
    },
    { 
        name: 'Google Calendar', 
        description: 'Schedule meetings, check availability, and manage your agenda.',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/2048px-Google_Calendar_icon_%282020%29.svg.png', 
        capabilities: ['Chat', 'Deep Dive', 'Agent Mode'] 
    },
    { 
        name: 'HubSpot', 
        description: 'Sync contacts, companies, and deals with your CRM.',
        logo: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/hubspot_logo_icon_169649.png', 
        capabilities: ['Chat', 'Deep Dive', 'Agent Mode'] 
    },
];

const ConnectorRow: React.FC<{ connector: Connector }> = ({ connector }) => {
    const { settings, updateSetting } = useSettings();
    const { t } = useLanguage();
    const [isConnecting, setIsConnecting] = useState(false);
    const isConnected = !!settings.connectors[connector.name];

    const handleConnect = () => {
        setIsConnecting(true);
        // Simulate network request
        setTimeout(() => {
            updateSetting(`connectors.${connector.name}`, true);
            toast.success(t('toast.connector_connected', { connectorName: connector.name }));
            setIsConnecting(false);
        }, 1500);
    };

    const handleDisconnect = () => {
        updateSetting(`connectors.${connector.name}`, false);
        toast.success(t('toast.connector_disconnected', { connectorName: connector.name }));
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-border last:border-b-0 gap-4 sm:gap-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 flex-shrink-0 bg-white dark:bg-neutral-800 rounded-lg p-2 border border-border flex items-center justify-center">
                    <img src={connector.logo} alt={`${connector.name} logo`} className="w-full h-full object-contain"/>
                </div>
                <div>
                    <h4 className="text-base font-semibold text-foreground leading-none mb-1.5">{connector.name}</h4>
                    <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                        {connector.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        {connector.capabilities.map(cap => (
                            <TooltipProvider key={cap}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wide",
                                            isConnected 
                                                ? "bg-primary-50 text-primary-700 border-primary/20 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary/30" 
                                                : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                                        )}>
                                            {cap === 'Agent Mode' && <span className="material-symbols-outlined text-[12px]">auto_awesome</span>}
                                            {cap}
                                        </div>
                                    </TooltipTrigger>
                                    {cap === 'Agent Mode' && 
                                        <TooltipContent>
                                            <p>{t('page_connectors.tooltip.agent_mode')}</p>
                                        </TooltipContent>
                                    }
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 sm:w-auto w-full justify-between sm:justify-end pl-16 sm:pl-0">
                <div className={cn(
                    "flex items-center gap-1.5 text-sm font-medium transition-colors duration-300",
                    isConnected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}>
                    <div className={cn("w-2 h-2 rounded-full transition-colors duration-300", isConnected ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600')}></div>
                    {isConnected ? t('page_connectors.status.connected') : t('page_connectors.status.not_connected')}
                </div>
                
                {isConnected ? (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9" onClick={() => toast.info("Configuration options would open here.")}>
                            {t('page_connectors.button.manage')}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleDisconnect}>
                            <span className="material-symbols-outlined text-lg">link_off</span>
                        </Button>
                    </div>
                ) : (
                    <Button 
                        onClick={handleConnect} 
                        disabled={isConnecting}
                        className="h-9 min-w-[100px]"
                    >
                        {isConnecting ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></span>
                                Connecting...
                            </>
                        ) : (
                            t('page_connectors.button.connect')
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
};

const Connectors: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_connectors.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('page_connectors.subtitle')}</p>
      </div>

      <SettingsCard title={t('page_connectors.integrations.title')} noPadding>
        <div>
            {connectors.map(connector => <ConnectorRow key={connector.name} connector={connector} />)}
        </div>
      </SettingsCard>
    </div>
  );
};

export default Connectors;
