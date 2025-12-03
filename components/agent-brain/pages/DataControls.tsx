// FIX: Created a complete DataControls component to resolve "not a module" error.
// This component provides a UI for managing data and privacy settings.
import React from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { useSettings } from '../../../context/SettingsContext';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { toast } from 'sonner';
import { useLanguage } from '../../../hooks/useLanguage';
import { Chip } from '../../ui/Chip';

const agents = [
    { id: 'drwin', nameKey: 'datacontrols.consents.agent.drwin', icon: 'auto_awesome' },
    { id: 'validateagent', nameKey: 'datacontrols.consents.agent.validateagent', icon: 'fact_check' },
    { id: 'createagent', nameKey: 'datacontrols.consents.agent.createagent', icon: 'lightbulb' },
];
const resources = [
    { id: 'organization', nameKey: 'datacontrols.consents.resource.organization', descKey: 'datacontrols.consents.resource.organization.desc' },
    { id: 'projects', nameKey: 'datacontrols.consents.resource.projects', descKey: 'datacontrols.consents.resource.projects.desc' }
];
const actions = ['read', 'search', 'validate', 'create'];


const ConsentRow: React.FC<{agent: typeof agents[0], resource: typeof resources[0]}> = ({ agent, resource }) => {
    const { settings, updateSetting } = useSettings();
    const { t } = useLanguage();

    const handleToggleConsent = (action: string) => {
        const currentConsents = settings.consents[agent.id]?.[resource.id] || [];
        const newConsents = currentConsents.includes(action)
            ? currentConsents.filter(a => a !== action)
            : [...currentConsents, action];
        const path = `consents.${agent.id}.${resource.id}`;
        updateSetting(path, newConsents);
    };

    return (
        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between border-t border-border first:border-t-0">
            <div className="w-full md:w-1/2 pr-8 mb-4 md:mb-0">
                 <div className="flex items-center gap-2 font-medium text-card-foreground">
                    <span className="material-symbols-outlined text-lg">{agent.icon}</span>
                    <span>{t(agent.nameKey as any)}</span>
                    <span className="material-symbols-outlined text-sm text-muted-foreground">arrow_right</span>
                    <span className="font-normal">{t(resource.nameKey as any)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t(resource.descKey as any)}</p>
            </div>
            <div className="flex-1 flex justify-start md:justify-end">
                <div className="flex flex-wrap gap-2">
                    {actions.map(action => (
                         <Chip 
                            key={action}
                            selected={settings.consents[agent.id]?.[resource.id]?.includes(action)}
                            onClick={() => handleToggleConsent(action)}
                        >
                            {t(`datacontrols.consents.action.${action}` as any)}
                        </Chip>
                    ))}
                </div>
            </div>
        </div>
    );
}

const DataControls: React.FC = () => {
    const { settings, updateSetting } = useSettings();
    const { t } = useLanguage();
    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

    const handleClearData = () => {
        toast.success(t('toast.clear_data_success'));
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_datacontrols.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('page_datacontrols.subtitle')}</p>
            
            <div className="mt-8 space-y-8">
                <SettingsCard title={t('datacontrols.consents.title')} noPadding>
                    <p className="p-4 text-sm text-muted-foreground">{t('datacontrols.consents.description')}</p>
                    <div className="divide-y divide-border border-t border-border">
                        {agents.map(agent => (
                            <React.Fragment key={agent.id}>
                                {resources.map(resource => (
                                    <ConsentRow key={`${agent.id}-${resource.id}`} agent={agent} resource={resource} />
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                </SettingsCard>

                <SettingsCard title={t('page_datacontrols.training.title')}>
                    <SettingsRow
                        title={t('page_datacontrols.training.improve.title')}
                        description={t('page_datacontrols.training.improve.desc')}
                    >
                        <ToggleSwitch
                            checked={settings.personalization.recordingMode}
                            onCheckedChange={v => updateSetting('personalization.recordingMode', v)}
                        />
                    </SettingsRow>
                </SettingsCard>

                <SettingsCard title={t('page_datacontrols.mission.title')}>
                    <SettingsRow
                        title={t('page_datacontrols.mission.clear.title')}
                        description={t('page_datacontrols.mission.clear.desc')}
                    >
                        <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>{t('page_datacontrols.mission.clear.button')}</Button>
                    </SettingsRow>
                </SettingsCard>
            </div>
            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title={t('page_datacontrols.dialog.clear.title')}
                description={t('page_datacontrols.dialog.clear.desc')}
                onConfirm={handleClearData}
                variant="destructive"
                confirmText={t('page_datacontrols.dialog.clear.confirm')}
            />
        </div>
    );
};

export default DataControls;