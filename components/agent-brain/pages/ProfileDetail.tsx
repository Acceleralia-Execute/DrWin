import React, { useState, useEffect, useMemo } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { Button } from '../../ui/Button';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { toast } from 'sonner';
import { Chip } from '../../ui/Chip';

interface ProfileDetailProps {
    profileId: string | null;
    onBack: () => void;
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({ profileId, onBack }) => {
    const { settings, updateSetting } = useSettings();
    const { t } = useLanguage();
    
    const isNew = profileId === 'new';
    
    const initialProfile = useMemo(() => {
        if (isNew) {
            return { id: Date.now().toString(), name: '', url: '', description: '', sector: '', location: '', products: '', targetAudience: '', documents: [] };
        }
        return settings.cognitiveProfiles.find(p => p.id === profileId) || null;
    }, [profileId, settings.cognitiveProfiles, isNew]);

    const [profile, setProfile] = useState(initialProfile);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!profile && !isNew) {
            onBack(); // Profile not found, go back
        }
    }, [profile, isNew, onBack]);

    useEffect(() => {
        if (profile?.url && profile.url.match(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)) {
            setIsScanning(true);
            const timer = setTimeout(() => {
                setIsScanning(false);
                setProfile(p => p ? ({ ...p, 
                    description: 'Pioneers in developing next-generation photovoltaic panels and integrated solar energy solutions for industrial use.',
                    products: 'High-efficiency PV panels, BIPV systems, Energy storage solutions',
                }) : null);
                toast.info(t('profile.ai_suggestion'));
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [profile?.url, t]);

    if (!profile) return null;

    const handleInputChange = (field: string, value: string) => {
        setProfile(p => p ? { ...p, [field]: value } : null);
    };

    const handleSave = () => {
        let profiles = [...settings.cognitiveProfiles];
        if (isNew) {
            profiles.push(profile);
        } else {
            profiles = profiles.map(p => p.id === profileId ? profile : p);
        }
        updateSetting('cognitiveProfiles', profiles);
        toast.success(`Profile ${isNew ? 'created' : 'updated'} successfully!`);
        onBack();
    };
    
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{isNew ? t('profile.title.new') : t('profile.title.edit')}</h1>
                    <p className="text-muted-foreground mt-1">{t('profile.subtitle')}</p>
                </div>
            </div>
            
            <div className="space-y-8 mt-8">
                <SettingsCard title={t('profile.initial_data')}>
                    <SettingsRow title={t('profile.company_name')} description="">
                         <Input className="w-80" placeholder="e.g., SolarTech Solutions" value={profile.name} onChange={e => handleInputChange('name', e.target.value)} />
                    </SettingsRow>
                    <SettingsRow title={t('profile.company_url')} description={t('profile.initial_data.desc')}>
                        <div className="relative w-80">
                            <Input placeholder="https://example.com" value={profile.url} onChange={e => handleInputChange('url', e.target.value)} />
                            {isScanning && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('profile.ai_extraction_status')}</span>
                                </div>
                            )}
                        </div>
                    </SettingsRow>
                </SettingsCard>

                <SettingsCard title={t('profile.basic_info')}>
                    <SettingsRow title={t('profile.description')} description=""><Textarea value={profile.description} onChange={e => handleInputChange('description', e.target.value)} /></SettingsRow>
                    <SettingsRow title={t('profile.sector')} description=""><Input className="w-80" value={profile.sector} onChange={e => handleInputChange('sector', e.target.value)} /></SettingsRow>
                    <SettingsRow title={t('profile.location')} description=""><Input className="w-80" value={profile.location} onChange={e => handleInputChange('location', e.target.value)} /></SettingsRow>
                    <SettingsRow title={t('profile.products')} description=""><Textarea value={profile.products} onChange={e => handleInputChange('products', e.target.value)} /></SettingsRow>
                    <SettingsRow title={t('profile.target_audience')} description=""><Textarea value={profile.targetAudience} onChange={e => handleInputChange('targetAudience', e.target.value)} /></SettingsRow>
                </SettingsCard>
                
                <SettingsCard title={t('profile.context_docs')} noPadding>
                    <div className="p-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground max-w-xl">{t('profile.context_docs.desc')}</p>
                        <Button variant="secondary">
                            <span className="material-symbols-outlined mr-2 text-base">upload_file</span>
                            {t('profile.upload_button')}
                        </Button>
                    </div>
                    {profile.documents.length > 0 &&
                    <div className="border-t border-border">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-neutral-50 dark:bg-neutral-900/50">
                                    <th className="p-3 text-sm font-semibold text-muted-foreground w-1/3">{t('profile.doc_table.name')}</th>
                                    <th className="p-3 text-sm font-semibold text-muted-foreground">{t('profile.doc_table.summary')}</th>
                                    <th className="p-3 text-sm font-semibold text-muted-foreground">{t('profile.doc_table.tags')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profile.documents.map(doc => (
                                    <tr key={doc.id} className="border-b border-border last:border-b-0">
                                        <td className="p-3 align-top">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg text-muted-foreground">{doc.type === 'PDF' ? 'picture_as_pdf' : 'article'}</span>
                                                <span className="font-medium text-sm">{doc.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground align-top">{doc.summary}</td>
                                        <td className="p-3 align-top">
                                            <div className="flex flex-wrap gap-1.5">
                                                {doc.tags.map(tag => <Chip key={tag} small>{tag}</Chip>)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    }
                </SettingsCard>
                
                <div className="flex justify-end">
                    <Button onClick={handleSave}>
                        {isNew ? t('profile.save_button') : t('profile.update_button')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetail;
