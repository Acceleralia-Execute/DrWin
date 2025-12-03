// FIX: Replaced placeholder content with a complete SettingsContext implementation.
// This context provides a global state for all user settings, persists them to localStorage,
// and offers an `updateSetting` utility to modify nested state properties. This resolves
// numerous module loading and dependency errors throughout the application.
import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { produce } from 'https://esm.sh/immer@10.1.1';
import set from 'https://esm.sh/lodash-es@4.17.21/set';

// FIX: Export Message interface for use in other components like Missions.tsx
export interface Attachment {
    name: string;
    type: string;
    // Base64 encoded data, without the 'data:mime/type;base64,' prefix
    data: string;
}

export interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: string;
    priority?: 'Low' | 'Medium' | 'High' | null;
    attachments?: Attachment[];
}

interface Settings {
  onboarding: { hasCompleted: boolean };
  system: { runOnLogin: boolean };
  appearance: { accentColor: string };
  language: { spokenLanguage: string; voice: string };
  personalization: {
    enabled: boolean;
    personality: string;
    customInstructions: string;
    nickname: string;
    occupation: string;
    about: string;
    referenceMemories: boolean;
    recordingMode: boolean;
    internetSearch: boolean;
  };
  notifications: {
    replies: string[];
    tasks: string[];
    projects: string[];
  };
  connectors: { [key: string]: boolean };
  consents: {
      [agentId: string]: {
          [resourceId: string]: string[]
      }
  };
  account: {
      name: string;
      links: { id: string; name: string; url: string }[];
      receiveFeedback: boolean;
  };
  organization: {
      legalName: string;
      brandName: string;
      vatId: string;
      country: string;
      industry: string;
      size: string;
      annualBudget: string;
      supportedLanguages: string;
  };
  // FIX: Add conversationHistory to Settings to store chat messages.
  conversationHistory: Message[];
  cognitiveProfile: any; // Simplified for now
  cognitiveProfiles: any[];
}

const defaultSettings: Settings = {
    onboarding: { hasCompleted: false },
    system: { runOnLogin: true },
    appearance: { accentColor: '#B84E9D' },
    language: { spokenLanguage: 'auto', voice: 'zephyr' },
    personalization: {
        enabled: true,
        personality: 'Default',
        customInstructions: 'The user is a grant consultant. Be concise, professional, and focus on providing actionable information for securing funding.',
        nickname: 'Ton',
        occupation: 'Strategy Director',
        about: 'Interested in renewable energy, AI, and international collaboration projects.',
        referenceMemories: true,
        recordingMode: false,
        internetSearch: true,
    },
    notifications: {
        replies: ['Notifications'],
        tasks: ['Notifications', 'Email'],
        projects: ['Email'],
    },
    connectors: {
        'Google Calendar': true,
    },
    consents: {
        drwin: { organization: ['read', 'search'], projects: ['read', 'search'] },
        validateagent: { organization: ['read'], projects: ['read', 'validate'] },
        createagent: { organization: ['read'], projects: ['read', 'create'] },
    },
    account: {
        name: 'Ton Guardiet',
        links: [{id: '1', name: 'LinkedIn', url: 'https://linkedin.com/in/ton-guardiet'}],
        receiveFeedback: true,
    },
    organization: {
        legalName: 'Acceleralia S.L.',
        brandName: 'Acceleralia',
        vatId: 'B65228637',
        country: 'ES',
        industry: 'M72',
        size: 'sme',
        annualBudget: '1M-10M',
        supportedLanguages: 'es-ES, en-US, ca-ES',
    },
    // FIX: Initialize conversationHistory in default settings.
    conversationHistory: [],
    cognitiveProfile: {
        legalName: 'SolarTech Solutions S.L.',
        brandName: 'SolarTech',
        url: 'https://solartech.example.com',
        description: 'Pioneers in developing next-generation photovoltaic panels and integrated solar energy solutions for industrial use.',
        country: 'ES',
        location: 'Valencia, Spain',
        industry: 'C27',
        sector: 'Renewable Energy',
        size: 'sme',
        products: 'High-efficiency PV panels, BIPV systems, Energy storage solutions',
        targetAudience: 'Industrial companies, large commercial real estate, utility providers',
        annualBudget: '1M-10M',
        supportedLanguages: 'es-ES, en-US',
        documents: [
            { id: 'doc1', name: 'Product_Roadmap_2024.pdf', type: 'PDF', summary: 'Outlines Q3/Q4 goals for BIPV efficiency improvements.', tags: ['roadmap', 'BIPV', 'Q3-2024'] },
            { id: 'doc2', name: 'Company_Intro_Deck.pptx', type: 'PPT', summary: 'General presentation about SolarTech, its mission, and key products.', tags: ['pitch', 'company-info'] }
        ],
    },
    cognitiveProfiles: [],
};

interface SettingsContextType {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  updateSetting: (path: string, value: any) => void;
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
        if (typeof window !== 'undefined') {
            const savedSettings = localStorage.getItem('app_settings');
            if (savedSettings) {
                // Merge saved settings with defaults to prevent errors if new settings are added
                return { ...defaultSettings, ...JSON.parse(savedSettings) };
            }
        }
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
        localStorage.setItem('app_settings', JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  const updateSetting = useCallback((path: string, value: any) => {
    setSettings(
      produce(draft => {
        set(draft, path, value);
      })
    );
  }, []);

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('app_settings');
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};