import React from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/Select';
import { useSettings } from '../../../context/SettingsContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { toast } from 'sonner';

// Mock data based on spec
const countries = [{ code: 'ES', name: 'Spain' }, { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' }, { code: 'IT', name: 'Italy' }, { code: 'US', name: 'United States' }];
const industries = [{ code: 'C27', name: 'C27 - Manufacturing of electrical equipment' }, { code: 'J62', name: 'J62 - Computer programming, consultancy' }, { code: 'M72', name: 'M72 - Scientific research and development' }];
const companySizes = [{ code: 'solo', nameKey: 'org.size.solo' }, { code: 'micro', nameKey: 'org.size.micro' }, { code: 'sme', nameKey: 'org.size.sme' }, { code: 'mid', nameKey: 'org.size.mid' }, { code: 'large', nameKey: 'org.size.large' }];
const budgetRanges = ['0-100k', '100k-1M', '1M-10M', '10M+'];

const Organization: React.FC = () => {
    const { settings, updateSetting } = useSettings();
    const { t } = useLanguage();

    const handleUpdateProfile = () => {
        toast.success("Organization profile updated successfully!");
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('org.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('org.subtitle')}</p>

            <div className="mt-8 space-y-8">
                <SettingsCard title={t('org.legal_info')}>
                    <SettingsRow title={t('org.legal_name')} description={t('org.legal_name.desc')}>
                        <Input className="w-64" value={settings.organization.legalName} onChange={e => updateSetting('organization.legalName', e.target.value)} />
                    </SettingsRow>
                    <SettingsRow title={t('org.brand_name')} description={t('org.brand_name.desc')}>
                        <Input className="w-64" value={settings.organization.brandName} onChange={e => updateSetting('organization.brandName', e.target.value)} />
                    </SettingsRow>
                    <SettingsRow title={t('org.vat')} description={t('org.vat.desc')}>
                        <Input className="w-64" value={settings.organization.vatId} onChange={e => updateSetting('organization.vatId', e.target.value)} />
                    </SettingsRow>
                </SettingsCard>

                <SettingsCard title={t('org.details')}>
                    <SettingsRow title={t('org.country')} description={t('org.country.desc')}>
                        <Select value={settings.organization.country} onValueChange={v => updateSetting('organization.country', v)}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select country..." />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </SettingsRow>
                    <SettingsRow title={t('org.industry')} description={t('org.industry.desc')}>
                        <Select value={settings.organization.industry} onValueChange={v => updateSetting('organization.industry', v)}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select industry..." />
                            </SelectTrigger>
                            <SelectContent>
                                {industries.map(i => <SelectItem key={i.code} value={i.code}>{i.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </SettingsRow>
                    <SettingsRow title={t('org.size')} description={t('org.size.desc')}>
                        <Select value={settings.organization.size} onValueChange={v => updateSetting('organization.size', v)}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select size..." />
                            </SelectTrigger>
                            <SelectContent>
                                {companySizes.map(s => <SelectItem key={s.code} value={s.code}>{t(s.nameKey as any)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </SettingsRow>
                </SettingsCard>
                
                <SettingsCard title={t('org.preferences')}>
                    <SettingsRow title={t('org.budget')} description={t('org.budget.desc')}>
                        <Select value={settings.organization.annualBudget} onValueChange={v => updateSetting('organization.annualBudget', v)}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select budget range..." />
                            </SelectTrigger>
                            <SelectContent>
                                {budgetRanges.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </SettingsRow>
                    <SettingsRow title={t('org.languages')} description={t('org.languages.desc')}>
                        <Input className="w-64" placeholder="e.g., es-ES, en-US" value={settings.organization.supportedLanguages} onChange={e => updateSetting('organization.supportedLanguages', e.target.value)} />
                    </SettingsRow>
                </SettingsCard>
                
                <div className="flex justify-end">
                    <Button onClick={handleUpdateProfile}>{t('org.update_button')}</Button>
                </div>
            </div>
        </div>
    );
};

export default Organization;