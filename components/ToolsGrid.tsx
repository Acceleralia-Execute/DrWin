import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { Tool } from '../types';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/HoverCard';

const tools: Tool[] = [
  { titleKey: "tools.promover.title", subtitleKey: "tools.promover.subtitle", descriptionKey: "tools.promover.description", icon: "campaign", href: "https://grantsales-home.grantswin.ai" },
  { titleKey: "tools.encontrar.title", subtitleKey: "tools.encontrar.subtitle", descriptionKey: "tools.encontrar.description", icon: "find_in_page", href: "https://app.acceleralia.com/complete-search" },
  { titleKey: "tools.crear.title", subtitleKey: "tools.crear.subtitle", descriptionKey: "tools.crear.description", icon: "lightbulb", href: "https://create.grantswin.ai/" },
  { titleKey: "tools.conectar.title", subtitleKey: "tools.conectar.subtitle", descriptionKey: "tools.conectar.description", icon: "handshake", href: "https://grantswin.ai/browse-opportunities/" },
  { titleKey: "tools.escribir.title", subtitleKey: "tools.escribir.subtitle", descriptionKey: "tools.escribir.description", icon: "edit_note", href: "http://Govsupply-Write.grantswin.ai/" },
  { titleKey: "tools.evaluar.title", subtitleKey: "tools.evaluar.subtitle", descriptionKey: "tools.evaluar.description", icon: "fact_check", href: "https://app.acceleralia.com/parts/100001453/37264/1008280" },
  { titleKey: "tools.readaptar.title", subtitleKey: "tools.readaptar.subtitle", descriptionKey: "tools.readaptar.description", icon: "autorenew", href: "https://readapt.grantswin.ai/" },
  { titleKey: "tools.gestionar.title", subtitleKey: "tools.gestionar.subtitle", descriptionKey: "tools.gestionar.description", icon: "bar_chart", href: "#" },
];

const ToolsGrid: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="px-6 lg:px-12 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-semibold text-secondary dark:text-neutral-200">
            {t('tools.grid_title' as any)}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 lg:gap-8">
          {tools.map((tool, index) => (
            <HoverCard key={index} openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <motion.a
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer"
                  whileHover={{ y: -8, transition: { duration: 0.2, ease: 'easeOut' } }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="bg-card rounded-2xl p-6 h-full border border-neutral-100 dark:border-transparent text-center group"
                    initial={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                    whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 bg-quaternary transition-all duration-200">
                      <span className="material-symbols-outlined text-secondary" style={{ fontSize: "2rem" }}>
                        {tool.icon}
                      </span>
                    </div>
                    <h3 className="uppercase text-lg font-bold mb-2 text-secondary dark:text-neutral-200 group-hover:text-primary transition-colors duration-200">
                      {t(tool.titleKey as any)}
                    </h3>
                    <p className="text-sm font-medium text-primary transition-colors duration-200">
                      {t(tool.subtitleKey as any)}
                    </p>
                  </motion.div>
                </motion.a>
              </HoverCardTrigger>
              <HoverCardContent className="shadow-lg bg-popover border border-neutral-500" side="top" sideOffset={12}>
                <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed text-center">
                  {t(tool.descriptionKey as any)}
                </p>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;