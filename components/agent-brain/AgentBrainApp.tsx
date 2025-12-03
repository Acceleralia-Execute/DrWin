
// FIX: Replaced placeholder content with a complete AgentBrainApp component. This component
// acts as the main layout for the "Agent Brain" feature, handling page routing between
// different settings pages and displaying an interactive onboarding tour for new users.
// This resolves the "not a module" error in App.tsx.
import React, { useState, lazy, Suspense } from 'react';
import Sidebar from './Sidebar';
import OnboardingTour from '../OnboardingTour';
import { useSettings } from '../../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { InstitutionalNav } from './InstitutionalNav';
import SupportModal from '../SupportModal';

// Lazy load pages for better performance
const Missions = lazy(() => import('./pages/Missions'));
const CognitiveProfiles = lazy(() => import('./pages/CognitiveProfiles'));
const Configuration = lazy(() => import('./pages/Configuration'));

const tourSteps = [
    { target: '', titleKey: 'onboarding.welcome.title', contentKey: 'onboarding.welcome.content', position: 'center' as const },
    { target: '[data-tour-id="sidebar-home"]', titleKey: 'onboarding.home.title', contentKey: 'onboarding.home.content', position: 'right' as const },
    { target: '[data-tour-id="chat-input"]', titleKey: 'onboarding.interactive.chat.title', contentKey: 'onboarding.interactive.chat.content', position: 'bottom' as const },
    { target: '[data-tour-id="send-button"]', titleKey: 'onboarding.interactive.send.title', contentKey: 'onboarding.interactive.send.content', position: 'bottom' as const, interactive: true },
    { target: '[data-tour-id="priority-button"]', titleKey: 'onboarding.interactive.priority.title', contentKey: 'onboarding.interactive.priority.content', position: 'bottom' as const, interactive: true },
    { target: '[data-tour-id="priority-option-high"]', titleKey: 'onboarding.interactive.select_priority.title', contentKey: 'onboarding.interactive.select_priority.content', position: 'bottom' as const, interactive: true, preDelay: 300 },
    { target: '[data-tour-id="chat-input"]', titleKey: 'onboarding.interactive.task.title', contentKey: 'onboarding.interactive.task.content', position: 'bottom' as const },
    { target: '[data-tour-id="send-button"]', titleKey: 'onboarding.interactive.send_task.title', contentKey: 'onboarding.interactive.send_task.content', position: 'bottom' as const, interactive: true },
    { target: '[data-tour-id="tasks-tab"]', titleKey: 'onboarding.interactive.tasks_tab.title', contentKey: 'onboarding.interactive.tasks_tab.content', position: 'bottom' as const, interactive: true },
    { target: '[data-tour-id="sidebar-profile"]', titleKey: 'onboarding.profile.title', contentKey: 'onboarding.profile.content', position: 'right' as const },
    { target: '[data-tour-id="sidebar-config"]', titleKey: 'onboarding.config.title', contentKey: 'onboarding.config.content', position: 'right' as const },
    { target: '[data-tour-id="sidebar-profile"]', titleKey: 'onboarding.org_profile.title', contentKey: 'onboarding.org_profile.content', position: 'right' as const },
];

const LoadingComponent: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const AgentBrainApp: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const [currentPage, setCurrentPage] = useState('missions');
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleTourComplete = () => {
    updateSetting('onboarding.hasCompleted', true);
  };

  const handlePageChange = (page: string) => {
    if (page === 'missions' && currentPage === 'missions') {
        // If clicking 'Home' while already on the home/missions page, reset the chat.
        updateSetting('conversationHistory', []);
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'missions':
        return <Missions />;
      case 'unified_profile':
        return <CognitiveProfiles />;
      case 'configuration':
        return <Configuration />;
      default:
        return <Missions />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <InstitutionalNav onSupportClick={() => setIsSupportOpen(true)} />
        <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<LoadingComponent />}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {renderPage()}
                    </motion.div>
                </AnimatePresence>
            </Suspense>
        </div>
      </main>
      <SupportModal open={isSupportOpen} onOpenChange={setIsSupportOpen} />
      <OnboardingTour
        steps={tourSteps}
        isOpen={!settings.onboarding.hasCompleted}
        onComplete={handleTourComplete}
        onRequestClose={handleTourComplete}
      />
    </div>
  );
};

export default AgentBrainApp;
