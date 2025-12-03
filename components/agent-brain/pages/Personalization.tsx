import React from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { Chip } from '../../ui/Chip';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../../context/SettingsContext';
import { useLanguage } from '../../../hooks/useLanguage';

const Personalization: React.FC = () => {
    const { settings, updateSetting } = useSettings();
    const { t } = useLanguage();
    const personalities = [
        { id: 'Default', key: 'page_personalization.personality.default' },
        { id: 'Talkative', key: 'page_personalization.personality.talkative' },
        { id: 'Forthright', key: 'page_personalization.personality.forthright' },
        { id: 'Witty', key: 'page_personalization.personality.witty' }
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_personalization.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('page_personalization.subtitle')}</p>
      
            <div className="mt-8 space-y-8">
                <SettingsCard>
                    <SettingsRow title={t('page_personalization.enable.title')} description={t('page_personalization.enable.desc')}>
                        <ToggleSwitch checked={settings.personalization.enabled} onCheckedChange={(val) => updateSetting('personalization.enabled', val)} />
                    </SettingsRow>
                    <AnimatePresence>
                        {settings.personalization.enabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 space-y-4">
                                    <SettingsRow title={t('page_personalization.personality.title')} description={t('page_personalization.personality.desc')}>
                                        <div className="flex flex-wrap gap-2">
                                            {personalities.map(p => (
                                                <Chip key={p.id} selected={settings.personalization.personality === p.id} onClick={() => updateSetting('personalization.personality', p.id)}>{t(p.key as any)}</Chip>
                                            ))}
                                        </div>
                                    </SettingsRow>
                                    <SettingsRow title={t('page_personalization.instructions.title')} description={t('page_personalization.instructions.desc')}>
                                        <Textarea 
                                            className="min-h-[120px] font-mono text-xs leading-relaxed"
                                            value={settings.personalization.customInstructions}
                                            onChange={(e) => updateSetting('personalization.customInstructions', e.target.value)}
                                        />
                                    </SettingsRow>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SettingsCard>

                <SettingsCard title={t('page_personalization.about.title')}>
                    <SettingsRow title={t('page_personalization.about.nickname.title')} description={t('page_personalization.about.nickname.desc')}>
                        <Input value={settings.personalization.nickname} onChange={(e) => updateSetting('personalization.nickname', e.target.value)} className="w-64" />
                    </SettingsRow>
                    <SettingsRow title={t('page_personalization.about.occupation.title')} description={t('page_personalization.about.occupation.desc')}>
                        <Input placeholder={t('page_personalization.about.occupation.placeholder')} className="w-64" value={settings.personalization.occupation} onChange={(e) => updateSetting('personalization.occupation', e.target.value)} />
                    </SettingsRow>
                    <SettingsRow title={t('page_personalization.about.more.title')} description={t('page_personalization.about.more.desc')}>
                        <Textarea value={settings.personalization.about} onChange={(e) => updateSetting('personalization.about', e.target.value)} />
                    </SettingsRow>
                </SettingsCard>
        
                <SettingsCard title={t('page_personalization.capabilities.title')}>
                    <SettingsRow title={t('page_personalization.capabilities.memory.title')} description={t('page_personalization.capabilities.memory.desc')}>
                        <div className="flex items-center gap-4">
                            <Button variant="secondary">{t('page_personalization.capabilities.memory.manage')}</Button>
                            <div className="flex items-center gap-2 text-sm">
                                <ToggleSwitch checked={settings.personalization.referenceMemories} onCheckedChange={(v) => updateSetting('personalization.referenceMemories', v)} />
                                <span>{t('page_personalization.capabilities.memory.reference')}</span>
                            </div>
                        </div>
                    </SettingsRow>
                    <SettingsRow title={t('page_personalization.capabilities.recording.title')} description={t('page_personalization.capabilities.recording.desc')}>
                        <ToggleSwitch checked={settings.personalization.recordingMode} onCheckedChange={(v) => updateSetting('personalization.recordingMode', v)} />
                    </SettingsRow>
                    <SettingsRow title={t('page_personalization.capabilities.search.title')} description={t('page_personalization.capabilities.search.desc')}>
                        <ToggleSwitch checked={settings.personalization.internetSearch} onCheckedChange={(v) => updateSetting('personalization.internetSearch', v)} />
                    </SettingsRow>
                </SettingsCard>
            </div>
        </div>
    );
};

export default Personalization;