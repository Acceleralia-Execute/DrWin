
import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { Button } from '../../ui/Button';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { toast } from 'sonner';
import { Chip } from '../../ui/Chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/Select';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper component for file upload simulation
const FileUploadRow: React.FC<{ title: string; description: string; status?: 'missing' | 'uploaded' }> = ({ title, description, status = 'missing' }) => {
    const { t } = useLanguage();
    return (
        <div className="p-4 flex items-center justify-between border-b border-border last:border-b-0">
            <div className="w-2/3 pr-8">
                <h4 className="font-medium text-card-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'uploaded' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                    <span className="material-symbols-outlined text-[14px]">{status === 'uploaded' ? 'check_circle' : 'error'}</span>
                    {status === 'uploaded' ? t('common.status.uploaded') : t('common.status.missing')}
                </div>
                <Button variant="outline" size="sm">
                    <span className="material-symbols-outlined text-sm mr-2">upload</span>
                    {t('common.upload')}
                </Button>
            </div>
        </div>
    );
};

const UnifiedProfile: React.FC = () => {
    const { settings, setSettings } = useSettings();
    const { t, language } = useLanguage();
    
    const [profile, setProfile] = useState<any>(settings.cognitiveProfile || {});
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    useEffect(() => {
        setProfile(settings.cognitiveProfile || {});
    }, [settings.cognitiveProfile]);

    const handleInputChange = (field: string, value: any) => {
        setProfile((p: any) => ({ ...p, [field]: value }));
    };

    const handleSave = () => {
        setSettings(prevSettings => ({
            ...prevSettings,
            cognitiveProfile: profile
        }));
        toast.success(t('toast.profile_updated'));
    };

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        try {
            // Construct a context prompt from existing profile fields
            const context = `
            Legal Name: ${profile.cif || 'N/A'}
            Signer: ${profile.signerName || 'N/A'}
            Headcount: ${profile.headcount || 'N/A'}
            Description: ${profile.description || 'N/A'}
            Team Summary: ${profile.teamSummary || 'N/A'}
            Project Memory: ${profile.projectMemory || 'N/A'}
            Impact: ${profile.projectImpact || 'N/A'}
            `;

            const systemInstruction = `You are an expert grant writer. Based on the provided organization details, write a professional, concise Executive Summary (max 200 words) suitable for public funding applications. Write in ${language === 'es' ? 'Spanish' : 'English'}.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: `Generate an executive summary based on this data:\n${context}` }] }],
                config: { systemInstruction }
            });

            if (response.text) {
                handleInputChange('executiveSummary', response.text);
                toast.success("Summary generated successfully!");
            }
        } catch (error) {
            console.error("Error generating summary:", error);
            toast.error("Failed to generate summary.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };
    
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('cognitive_profile.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('cognitive_profile.subtitle')}</p>
            
            <div className="space-y-8 mt-8">
                
                {/* Section 1: Company & Legal */}
                <SettingsCard title={t('profile.section.legal')} noPadding>
                    <div className="divide-y divide-border">
                        <SettingsRow title={t('profile.legal.cif')} description={t('profile.legal.cif.desc')}>
                            <Input className="w-64" value={profile.cif} onChange={e => handleInputChange('cif', e.target.value)} placeholder="e.g., B12345678" />
                        </SettingsRow>
                        <FileUploadRow title={t('profile.legal.deeds')} description={t('profile.legal.deeds.desc')} status="uploaded" />
                        <SettingsRow title={t('profile.legal.powers')} description={t('profile.legal.powers.desc')}>
                            <Input className="w-64" value={profile.signerName} onChange={e => handleInputChange('signerName', e.target.value)} placeholder="Signer Name" />
                        </SettingsRow>
                        <FileUploadRow title={t('profile.legal.bank')} description={t('profile.legal.bank.desc')} />
                        <FileUploadRow title={t('profile.legal.org')} description={t('profile.legal.org.desc')} />
                    </div>
                </SettingsCard>

                {/* Section 2: Fiscal & SS */}
                <SettingsCard title={t('profile.section.fiscal')} noPadding>
                    <div className="divide-y divide-border">
                        <FileUploadRow title={t('profile.fiscal.aeat')} description={t('profile.fiscal.aeat.desc')} status="uploaded"/>
                        <FileUploadRow title={t('profile.fiscal.tgss')} description={t('profile.fiscal.tgss.desc')} />
                        <FileUploadRow title={t('profile.fiscal.returns')} description={t('profile.fiscal.returns.desc')} />
                    </div>
                </SettingsCard>

                {/* Section 3: Finance */}
                <SettingsCard title={t('profile.section.finance')} noPadding>
                    <div className="divide-y divide-border">
                        <FileUploadRow title={t('profile.finance.accounts')} description={t('profile.finance.accounts.desc')} status="uploaded"/>
                        <FileUploadRow title={t('profile.finance.balance')} description={t('profile.finance.balance.desc')} />
                        <SettingsRow title={t('profile.finance.headcount')} description={t('profile.finance.headcount.desc')}>
                            <Input type="number" className="w-32" value={profile.headcount} onChange={e => handleInputChange('headcount', e.target.value)} placeholder="0" />
                        </SettingsRow>
                    </div>
                </SettingsCard>

                {/* Section 4: Technical Capacity */}
                <SettingsCard title={t('profile.section.technical')}>
                    <SettingsRow title={t('profile.technical.memory')} description={t('profile.technical.memory.desc')}>
                        <Textarea className="min-h-[100px]" value={profile.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Corporate summary..." />
                    </SettingsRow>
                    <SettingsRow title={t('profile.technical.cvs')} description={t('profile.technical.cvs.desc')}>
                        <Textarea value={profile.teamSummary} onChange={e => handleInputChange('teamSummary', e.target.value)} placeholder="Key team members and roles..." />
                    </SettingsRow>
                    <SettingsRow title={t('profile.technical.refs')} description={t('profile.technical.refs.desc')}>
                        <Textarea value={profile.references} onChange={e => handleInputChange('references', e.target.value)} placeholder="List 2-5 similar projects..." />
                    </SettingsRow>
                </SettingsCard>

                {/* Section 5: Corporate Assets (General) */}
                <SettingsCard title={t('profile.section.assets')} noPadding>
                    <div className="divide-y divide-border">
                        <SettingsRow title={t('profile.assets.links')} description={t('profile.assets.links.desc')}>
                            <Textarea className="min-h-[80px]" value={profile.webLinks} onChange={e => handleInputChange('webLinks', e.target.value)} placeholder="https://..." />
                        </SettingsRow>
                        <FileUploadRow title={t('profile.assets.documents')} description={t('profile.assets.documents.desc')} />
                    </div>
                </SettingsCard>

                {/* Section 6: Project Base */}
                <SettingsCard title={t('profile.section.project')}>
                    <SettingsRow title={t('profile.project.memory')} description={t('profile.project.memory.desc')}>
                        <Textarea className="min-h-[120px]" value={profile.projectMemory} onChange={e => handleInputChange('projectMemory', e.target.value)} placeholder="Objective, scope, work plan..." />
                    </SettingsRow>
                    <SettingsRow title={t('profile.project.budget')} description={t('profile.project.budget.desc')}>
                        <Textarea value={profile.projectBudget} onChange={e => handleInputChange('projectBudget', e.target.value)} placeholder="Budget breakdown..." />
                    </SettingsRow>
                    <SettingsRow title={t('profile.project.gantt')} description={t('profile.project.gantt.desc')}>
                        <Textarea value={profile.projectGantt} onChange={e => handleInputChange('projectGantt', e.target.value)} placeholder="Timeline summary..." />
                    </SettingsRow>
                    <SettingsRow title={t('profile.project.impact')} description={t('profile.project.impact.desc')}>
                        <Textarea value={profile.projectImpact} onChange={e => handleInputChange('projectImpact', e.target.value)} placeholder="KPIs and expected impact..." />
                    </SettingsRow>
                </SettingsCard>

                {/* Section 7: Declarations */}
                <SettingsCard title={t('profile.section.declarations')}>
                    <SettingsRow title={t('profile.declarations.prohibitions')} description={t('profile.declarations.prohibitions.desc')}>
                        <ToggleSwitch checked={profile.declProhibitions} onCheckedChange={v => handleInputChange('declProhibitions', v)} />
                    </SettingsRow>
                    <SettingsRow title={t('profile.declarations.double_funding')} description={t('profile.declarations.double_funding.desc')}>
                        <ToggleSwitch checked={profile.declDoubleFunding} onCheckedChange={v => handleInputChange('declDoubleFunding', v)} />
                    </SettingsRow>
                    <SettingsRow title={t('profile.declarations.compliance')} description={t('profile.declarations.compliance.desc')}>
                        <ToggleSwitch checked={profile.declCompliance} onCheckedChange={v => handleInputChange('declCompliance', v)} />
                    </SettingsRow>
                    <SettingsRow title={t('profile.declarations.sme')} description={t('profile.declarations.sme.desc')}>
                        <Select value={profile.smeSize} onValueChange={v => handleInputChange('smeSize', v)}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select size..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="micro">Micro</SelectItem>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large / Non-SME</SelectItem>
                            </SelectContent>
                        </Select>
                    </SettingsRow>
                </SettingsCard>
                
                {/* Privacy Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 shrink-0">lock</span>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                        {t('profile.privacy_notice')}
                    </p>
                </div>

                {/* Section 8: Executive Summary */}
                <div className="mt-8">
                    <SettingsCard title={t('profile.section.summary')}>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-muted-foreground">{t('profile.summary.desc')}</p>
                            <Textarea 
                                className="min-h-[200px] bg-neutral-50 dark:bg-neutral-900 font-medium leading-relaxed" 
                                value={profile.executiveSummary || ''} 
                                onChange={e => handleInputChange('executiveSummary', e.target.value)} 
                                placeholder="Executive Summary..." 
                            />
                            <div className="flex justify-end">
                                <Button variant="secondary" size="sm" onClick={handleGenerateSummary} disabled={isGeneratingSummary}>
                                    {isGeneratingSummary ? (
                                        <>
                                            <span className="material-symbols-outlined text-base animate-spin mr-2">sync</span>
                                            {t('profile.generating')}
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-base mr-2">auto_awesome</span>
                                            {t('profile.generate_summary')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </SettingsCard>
                </div>

                <div className="flex justify-end pb-10">
                    <Button onClick={handleSave} className="w-full sm:w-auto">
                        {t('profile.update_button')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UnifiedProfile;
