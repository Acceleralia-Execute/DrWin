import React from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { useSettings } from '../../../context/SettingsContext';
import { useLanguage } from '../../../hooks/useLanguage';

const Notifications: React.FC = () => {
    const { settings, updateSetting } = useSettings();
    const { t } = useLanguage();

    const handleChipToggle = (category: 'replies' | 'tasks' | 'projects', value: string) => {
        const currentValues: string[] = settings.notifications[category] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        updateSetting(`notifications.${category}`, newValues);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_notifications.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('page_notifications.subtitle')}</p>

            <div className="mt-8 space-y-8">
                <SettingsCard title={t('page_notifications.rules.title')}>
                    <SettingsRow
                        title={t('page_notifications.rules.replies.title')}
                        description={t('page_notifications.rules.replies.desc')}
                    >
                        <div className="flex items-center gap-2">
                            <Chip selected={settings.notifications.replies.includes('Notifications')} onClick={() => handleChipToggle('replies', 'Notifications')}>{t('page_notifications.chip.notifications')}</Chip>
                        </div>
                    </SettingsRow>
                    <SettingsRow
                        title={t('page_notifications.rules.tasks.title')}
                        description={t('page_notifications.rules.tasks.desc')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Chip selected={settings.notifications.tasks.includes('Notifications')} onClick={() => handleChipToggle('tasks', 'Notifications')}>{t('page_notifications.chip.notifications')}</Chip>
                                <Chip selected={settings.notifications.tasks.includes('Email')} onClick={() => handleChipToggle('tasks', 'Email')}>{t('page_notifications.chip.email')}</Chip>
                            </div>
                            <Button variant="link">{t('page_notifications.rules.tasks.manage')}</Button>
                        </div>
                    </SettingsRow>
                    <SettingsRow
                        title={t('page_notifications.rules.projects.title')}
                        description={t('page_notifications.rules.projects.desc')}
                    >
                        <div className="flex items-center gap-2">
                            <Chip selected={settings.notifications.projects.includes('Email')} onClick={() => handleChipToggle('projects', 'Email')}>{t('page_notifications.chip.email')}</Chip>
                        </div>
                    </SettingsRow>
                </SettingsCard>
            </div>
        </div>
    );
};

export default Notifications;