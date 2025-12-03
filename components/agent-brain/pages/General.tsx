import React, { useState } from 'react';
import { SettingsCard } from '../../ui/SettingsCard';
import { SettingsRow } from '../../ui/SettingsRow';
import { Button } from '../../ui/Button';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../ui/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/Tooltip';
import { useSettings } from '../../../context/SettingsContext';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../hooks/useLanguage';
import { GoogleGenAI, Modality } from '@google/genai';
import { toast } from 'sonner';
import { decode, decodeAudioData } from '../../../lib/audio';
import { cn } from '../../../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const General: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [textSize, setTextSize] = useState(100);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const voices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

  const availableLanguages = [
    { code: 'es', label: 'Español' },
    { code: 'ca', label: 'Català' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
  ];

  const handleTextSizeChange = (amount: number) => {
    setTextSize(prev => Math.max(50, Math.min(150, prev + amount)));
  };

  const handleCheckForUpdates = () => {
    setIsCheckingUpdates(true);
    toast.info(t('toast.checking_updates'));
    setTimeout(() => {
        setIsCheckingUpdates(false);
        toast.success(t('toast.latest_version'));
    }, 2000);
  };

  const handlePlayVoice = async (voice: string) => {
    if (playingVoice) return;
    setPlayingVoice(voice);
    toast.info(t('toast.generating_voice', { voiceName: voice }));
    try {
        const voiceName = voice;
        const prompt = language === 'es' 
          ? `Di con alegría: ¡Hola! Soy ${voiceName}, tu asistente de IA.`
          : `Say cheerfully: Hello! I'm ${voiceName}, your AI assistant.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContext,
                24000,
                1,
            );
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.start();
            source.onended = () => setPlayingVoice(null);
        } else {
             toast.error(t('toast.generate_voice_error'));
             setPlayingVoice(null);
        }
    } catch (error) {
        console.error("TTS error:", error);
        toast.error(t('toast.play_voice_error'));
        setPlayingVoice(null);
    }
  };

  const handleStartTour = () => {
    updateSetting('onboarding.hasCompleted', false);
    // The tour will be triggered automatically by the effect in AgentBrainApp
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary-800 dark:text-neutral-200">{t('page_general.title')}</h1>
      <p className="text-muted-foreground mt-1">{t('page_general.subtitle')}</p>

      <div className="mt-8 space-y-8">
        <SettingsCard title={t('page_general.system.title')}>
          <SettingsRow
            title={t('page_general.system.updates.title')}
            description={t('page_general.system.updates.desc')}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" onClick={handleCheckForUpdates} disabled={isCheckingUpdates}>
                    {isCheckingUpdates ? t('page_general.system.updates.button_checking') : t('page_general.system.updates.button')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('page_general.system.updates.tooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SettingsRow>
          <SettingsRow
            title={t('page_general.system.login.title')}
            description={t('page_general.system.login.desc')}
          >
            <ToggleSwitch checked={settings.system.runOnLogin} onCheckedChange={(val) => updateSetting('system.runOnLogin', val)} />
          </SettingsRow>
          <SettingsRow
            title={t('page_general.system.shortcut.title')}
            description={t('page_general.system.shortcut.desc')}
          >
            <div className="px-3 py-1.5 border border-border rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-sm">
              Alt + SPACE
            </div>
          </SettingsRow>
        </SettingsCard>

        <SettingsCard title={t('page_general.appearance.title')}>
          <SettingsRow title={t('page_general.appearance.theme.title')} description={t('page_general.appearance.theme.desc')}>
            <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('page_general.appearance.theme.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t('page_general.appearance.theme.system')}</SelectItem>
                <SelectItem value="light">{t('page_general.appearance.theme.light')}</SelectItem>
                <SelectItem value="dark">{t('page_general.appearance.theme.dark')}</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
          <SettingsRow title={t('page_general.appearance.accent.title')} description={t('page_general.appearance.accent.desc')}>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="color"
                        id="accent-color-picker"
                        value={settings.appearance.accentColor}
                        onChange={(e) => updateSetting('appearance.accentColor', e.target.value)}
                        className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                    <label htmlFor="accent-color-picker" className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md cursor-pointer bg-background hover:bg-accent">
                        <div 
                            className="w-5 h-5 rounded-sm border border-border" 
                            style={{ backgroundColor: settings.appearance.accentColor }}
                        ></div>
                        <code className="text-sm font-semibold">{settings.appearance.accentColor}</code>
                    </label>
                </div>
            </div>
          </SettingsRow>
          <SettingsRow title={t('page_general.appearance.textsize.title')} description={t('page_general.appearance.textsize.desc')}>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTextSizeChange(-10)}><span className="material-symbols-outlined text-base">remove</span></Button>
              <span className="w-12 text-center font-semibold">{textSize}%</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleTextSizeChange(10)}><span className="material-symbols-outlined text-base">add</span></Button>
              <Button variant="link" onClick={() => setTextSize(100)}>{t('page_general.appearance.textsize.reset')}</Button>
            </div>
          </SettingsRow>
        </SettingsCard>
        
        <SettingsCard title={t('page_general.language.title')}>
            <SettingsRow title={t('page_general.language.ui.title')} description={t('page_general.language.ui.desc')}>
                 <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder={t('page_general.language.ui.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {availableLanguages.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </SettingsRow>
            <SettingsRow title={t('page_general.language.spoken.title')} description={t('page_general.language.spoken.desc')}>
                 <Select value={settings.language.spokenLanguage} onValueChange={(v) => updateSetting('language.spokenLanguage', v)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder={t('page_general.language.ui.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="auto">{t('page_general.language.spoken.auto')}</SelectItem>
                        {availableLanguages.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </SettingsRow>
             <div className="p-4">
                <div className="w-2/3 pr-8">
                    <h4 className="font-medium text-card-foreground">{t('page_general.language.voice.title')}</h4>
                    <p className="text-sm text-muted-foreground">{t('page_general.language.voice.desc')}</p>
                </div>
                <div className="pt-4 space-y-1">
                    {voices.map((voice) => {
                        const isSelected = settings.language.voice === voice.toLowerCase();
                        const isPlaying = playingVoice === voice;
                        return (
                            <div
                                key={voice}
                                onClick={() => updateSetting('language.voice', voice.toLowerCase())}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer",
                                    isSelected && "bg-primary-50 dark:bg-primary-900/20"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-primary/50">
                                        {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                                    </div>
                                    <span className={cn("font-medium", isSelected ? 'text-primary' : 'text-card-foreground')}>{voice}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayVoice(voice);
                                    }}
                                    disabled={!!playingVoice}
                                >
                                    <span className="material-symbols-outlined text-base">
                                        {isPlaying ? 'volume_up' : 'play_arrow'}
                                    </span>
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SettingsCard>

        <SettingsCard title={t('page_general.help.title')}>
          <SettingsRow
            title={t('page_general.help.tour.title')}
            description={t('page_general.help.tour.desc')}
          >
            <Button variant="secondary" onClick={handleStartTour}>
              {t('page_general.help.tour.button')}
            </Button>
          </SettingsRow>
        </SettingsCard>
      </div>
    </div>
  );
};

export default General;