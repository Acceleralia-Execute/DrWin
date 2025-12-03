import React from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { useSettings } from '../../../context/SettingsContext';
import { toast } from 'sonner';
import { useLanguage } from '../../../hooks/useLanguage';

const Account: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const { t } = useLanguage();

  const handleLinkChange = (id: string, field: 'name' | 'url', value: string) => {
    const newLinks = settings.account.links.map(link => 
        link.id === id ? { ...link, [field]: value } : link
    );
    updateSetting('account.links', newLinks);
  };

  const handleAddLink = () => {
      const newLinks = [...settings.account.links, { id: Date.now().toString(), name: '', url: '' }];
      updateSetting('account.links', newLinks);
  };

  const handleRemoveLink = (id: string) => {
      const newLinks = settings.account.links.filter(link => link.id !== id);
      updateSetting('account.links', newLinks);
  };

  const handleUpdateProfile = () => {
    toast.success(t('toast.profile_updated'));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_account.title')}</h1>
      <p className="text-muted-foreground mt-1">{t('page_account.subtitle')}</p>

      <div className="mt-8 space-y-8">
        <SettingsCard title={t('page_account.preview.title')}>
            <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-md border border-border">
                <h4 className="font-bold">Agentic Brain</h4>
                <p className="text-sm text-muted-foreground">
                    {settings.account.name 
                        ? t('page_account.preview.byline', { name: settings.account.name }) 
                        : t('page_account.preview.anonymous')}
                </p>
            </div>
        </SettingsCard>

        <SettingsCard title={t('page_account.config.title')}>
          <SettingsRow
            title={t('page_account.config.name.title')}
            description={t('page_account.config.name.desc')}
          >
            <Input value={settings.account.name} onChange={e => updateSetting('account.name', e.target.value)} className="w-64" />
          </SettingsRow>
          <div className="p-4 space-y-4">
             <Label>{t('page_account.config.links.title')}</Label>
             <div className="space-y-3">
                {settings.account.links.map(link => (
                    <div key={link.id} className="flex items-center gap-2">
                        <Input 
                            placeholder={t('page_account.config.links.name_placeholder')} 
                            value={link.name} 
                            onChange={(e) => handleLinkChange(link.id, 'name', e.target.value)}
                            className="w-28"/>
                        <Input 
                            placeholder={t('page_account.config.links.url_placeholder')} 
                            value={link.url}
                            onChange={(e) => handleLinkChange(link.id, 'url', e.target.value)}
                            className="flex-1"/>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => handleRemoveLink(link.id)}>
                            <span className="material-symbols-outlined text-base">delete</span>
                        </Button>
                    </div>
                ))}
             </div>
             <Button variant="outline" size="sm" className="gap-1.5" onClick={handleAddLink}>
                <span className="material-symbols-outlined text-sm">add</span> {t('page_account.config.links.add')}
             </Button>
          </div>
          <SettingsRow
            title={t('page_account.config.feedback.title')}
            description={t('page_account.config.feedback.desc')}
          >
            <div className="flex items-center gap-4">
                <p className="text-sm font-medium">ton.guardiet@acceleralia.com</p>
                <div className="flex items-center gap-2 text-sm">
                    <ToggleSwitch checked={settings.account.receiveFeedback} onCheckedChange={(v) => updateSetting('account.receiveFeedback', v)} />
                    <span>{t('page_account.config.feedback.toggle')}</span>
                </div>
            </div>
          </SettingsRow>
        </SettingsCard>
        
        <div className="flex justify-end">
            <Button onClick={handleUpdateProfile}>{t('page_account.button.update')}</Button>
        </div>
      </div>
    </div>
  );
};

export default Account;