import React, { useState, useEffect } from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { useLanguage } from '../../../hooks/useLanguage';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useSettings } from '../../../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

const contracts = {
    CompanyProfile: {
      "name": "string", "url": "string", "sector": ["string"], "location": "string",
      "products": ["string"], "audience": ["string"], "language": "string", "budget_range": "string",
      "docs_linked": ["string"], "metadata": { "last_updated": "timestamp", "profile_owner": "user_id" }
    },
    GrantRequirement: {
      "program_name": "string", "sector": ["string"], "geo": "string", "size": "string",
      "trl": "integer", "deadline": "date", "docs_required": ["string"], "eligibility_criteria": ["string"]
    },
    EligibilityMatch: {
      "profile_id": "uuid", "program_id": "uuid", "score": "float", "criteria_met": ["string"],
      "criteria_missing": ["string"], "rationale": "string", "updated_at": "timestamp"
    }
};

const mockEvents = [
    { name: 'profile.updated', source: 'ProfileDetail', profileId: '1' },
    { name: 'eligibility.updated', source: 'ValidateAgent', profileId: '1' },
    { name: 'docs.ingested', source: 'ProfileDetail', profileId: '2' },
    { name: 'proposal.created', source: 'CreateAgent', profileId: '1' },
    { name: 'grant.submitted', source: 'WebApp', profileId: '1' },
];

const SuiteIntegrator: React.FC = () => {
    const { t } = useLanguage();
    const { settings } = useSettings();
    const [activeContract, setActiveContract] = useState('CompanyProfile');
    const [events, setEvents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [interpretation, setInterpretation] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
            const newEvent = {
                ...randomEvent,
                id: Date.now(),
                correlationId: `cor_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toLocaleTimeString(),
            };
            setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = () => {
        if (!searchQuery) return;
        setIsSearching(true);
        setSearchResults([]);
        setInterpretation('');

        setTimeout(() => {
            const query = searchQuery.toLowerCase();
            const results = settings.cognitiveProfiles.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.sector.toLowerCase().includes(query) ||
                p.location.toLowerCase().includes(query)
            );
            
            setInterpretation(`sector='${results[0]?.sector || 'renewable energy'}', location='${results[0]?.location || 'Spain'}'`);
            setSearchResults(results);
            setIsSearching(false);
        }, 1500);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('suite_integrator.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('suite_integrator.subtitle')}</p>

            <div className="mt-8 space-y-8">
                <SettingsCard title={t('suite_integrator.contracts.title')}>
                    <p className="px-4 py-2 text-sm text-muted-foreground">{t('suite_integrator.contracts.desc')}</p>
                    <div className="px-4 pb-4">
                        <div className="flex items-center gap-2 border-b border-border mb-2">
                            {Object.keys(contracts).map(name => (
                                <button key={name} onClick={() => setActiveContract(name)} className={cn("px-3 py-1.5 text-sm font-medium rounded-t-md", activeContract === name ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
                                    {name}.v1
                                </button>
                            ))}
                        </div>
                        <pre className="bg-neutral-100 dark:bg-neutral-900 rounded-md p-4 text-xs font-mono overflow-x-auto">
                            {JSON.stringify(contracts[activeContract as keyof typeof contracts], null, 2)}
                        </pre>
                    </div>
                </SettingsCard>

                <SettingsCard title={t('suite_integrator.events.title')} noPadding>
                     <p className="px-4 pt-4 text-sm text-muted-foreground">{t('suite_integrator.events.desc')}</p>
                     <div className="mt-2">
                        <table className="w-full text-left">
                            <thead className="border-b border-t border-border bg-neutral-50 dark:bg-neutral-900/50">
                                <tr>
                                    <th className="p-3 text-xs font-semibold text-muted-foreground">{t('suite_integrator.events.table.event')}</th>
                                    <th className="p-3 text-xs font-semibold text-muted-foreground">{t('suite_integrator.events.table.source')}</th>
                                    <th className="p-3 text-xs font-semibold text-muted-foreground">{t('suite_integrator.events.table.profile')}</th>
                                    <th className="p-3 text-xs font-semibold text-muted-foreground">{t('suite_integrator.events.table.correlation')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <AnimatePresence initial={false}>
                                {events.map((event) => (
                                    <motion.tr key={event.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                        <td className="p-3 text-sm font-medium">{event.name}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{event.source}</td>
                                        <td className="p-3 text-sm text-muted-foreground font-mono">{event.profileId}</td>
                                        <td className="p-3 text-sm text-muted-foreground font-mono">{event.correlationId}</td>
                                    </motion.tr>
                                ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                     </div>
                </SettingsCard>

                <SettingsCard title={t('suite_integrator.semantic_search.title')}>
                    <p className="px-4 py-2 text-sm text-muted-foreground">{t('suite_integrator.semantic_search.desc')}</p>
                    <div className="p-4 space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder={t('suite_integrator.semantic_search.placeholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}/>
                            <Button onClick={handleSearch} disabled={isSearching} className="w-32">
                                {isSearching ? t('suite_integrator.semantic_search.searching') : t('suite_integrator.semantic_search.button')}
                            </Button>
                        </div>
                        <AnimatePresence>
                        {(isSearching || searchResults.length > 0 || interpretation) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 border-t border-border">
                               {isSearching ? <div className="flex items-center justify-center p-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div> :
                                <>
                                    {interpretation && <div className="mb-4">
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">{t('suite_integrator.semantic_search.interpretation')}</h4>
                                        <code className="text-sm bg-neutral-100 dark:bg-neutral-800 rounded px-2 py-1">{interpretation}</code>
                                    </div>}
                                    {searchResults.length > 0 ? (
                                        <div className="space-y-2">
                                            {searchResults.map(profile => (
                                                <div key={profile.id} className="p-3 border border-border rounded-md bg-background hover:border-primary/50">
                                                    <h4 className="font-semibold">{profile.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{profile.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-sm text-center text-muted-foreground p-4">{t('suite_integrator.semantic_search.no_results')}</p>}
                                </>
                               }
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </SettingsCard>
            </div>
        </div>
    );
};

export default SuiteIntegrator;
