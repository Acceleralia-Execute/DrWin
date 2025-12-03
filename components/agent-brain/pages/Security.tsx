// FIX: Created a complete Security component to resolve "not a module" error.
// This component provides a UI for managing security settings like password and 2FA.
import React from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { useSettings } from '../../../context/SettingsContext';
import { useLanguage } from '../../../hooks/useLanguage';

const Security: React.FC = () => {
    const { settings } = useSettings();
    const { t } = useLanguage();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_security.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('page_security.subtitle')}</p>

            <div className="mt-8 space-y-8">
                <SettingsCard title={t('page_security.auth.title')}>
                    <SettingsRow
                        title={t('page_security.auth.password.title')}
                        description={t('page_security.auth.password.desc')}
                    >
                        <Button variant="secondary">{t('page_security.auth.password.button')}</Button>
                    </SettingsRow>
                    <SettingsRow
                        title={t('page_security.auth.2fa.title')}
                        description={t('page_security.auth.2fa.desc')}
                    >
                        <ToggleSwitch defaultChecked={false} />
                    </SettingsRow>
                </SettingsCard>

                <SettingsCard title={t('page_security.sessions.title')}>
                     <SettingsRow
                        title={t('page_security.sessions.current.title')}
                        description={t('page_security.sessions.current.desc', { browser: 'Chrome', os: 'macOS', location: 'Barcelona, Spain' })}
                    >
                        <span className="text-sm font-semibold text-tertiary-600">{t('page_security.sessions.current.status')}</span>
                    </SettingsRow>
                    <div className="p-4 flex justify-end">
                        <Button variant="secondary">{t('page_security.sessions.logout.button')}</Button>
                    </div>
                </SettingsCard>
            </div>
        </div>
    );
};

export default Security;