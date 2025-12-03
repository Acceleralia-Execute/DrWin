import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { TenderswinLogo } from '../assets/TenderswinLogo';
import { GovsupplyLogo } from '../assets/GovsupplyLogo';
import { AcceleraliaLogo } from '../assets/AcceleraliaLogo';
import { SuiteApp } from '../types';

const suiteApps: SuiteApp[] = [
  { title: "TendersWin.AI", descriptionKey: "suite.tenderswin.description", href: "http://tenderswin-home.grantswin.ai/" },
  { title: "GovSupply.AI", descriptionKey: "suite.govsupply.description", href: "http://govsupply.grantswin.ai/" },
  { title: "ACCELERALIA", descriptionKey: "suite.acceleralia.description", href: "#" },
];

const SuiteSection: React.FC = () => {
  const { t } = useLanguage();

  const renderLogo = (title: string) => {
    if (title === "TendersWin.AI") return <TenderswinLogo />;
    if (title === "GovSupply.AI") return <GovsupplyLogo />;
    if (title === "ACCELERALIA") return <AcceleraliaLogo />;
    return null;
  };
  
  const renderTitle = (title: string) => {
      if (title === "TendersWin.AI") {
          return (
            <div className="flex items-center mb-2">
                <span className="text-2xl font-bold text-secondary dark:text-neutral-200">TENDERS</span>
                <span className="text-2xl font-semibold text-senary">WIN.AI</span>
            </div>
          );
      }
      if (title === "GovSupply.AI") {
          return (
            <div className="flex items-center mb-2">
                <span className="text-2xl font-bold text-secondary dark:text-neutral-200">GOV</span>
                <span className="text-2xl font-semibold text-octonary">SUPPLY.AI</span>
            </div>
          );
      }
      if (title === "ACCELERALIA") {
        return (
          <div className="flex items-center mb-2">
              <span className="text-2xl font-bold text-secondary dark:text-neutral-200">ACCELERALIA</span>
          </div>
        );
    }
      return title;
  }

  return (
    <section className="px-6 lg:px-12 py-16 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-2xl lg:text-3xl font-semibold mb-4 text-secondary dark:text-neutral-200">
            {t('suite.title')}
          </h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('suite.description')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suiteApps.map((app, index) => (
             <div key={app.title} className={`w-full ${suiteApps.length % 2 !== 0 && index === suiteApps.length - 1 ? 'md:col-span-2 md:flex md:justify-center' : ''}`}>
                <motion.a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`block group cursor-pointer h-full ${suiteApps.length % 2 !== 0 && index === suiteApps.length - 1 ? 'md:w-1/2' : ''}`}
                whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                whileTap={{ scale: 0.98 }}
                >
                <motion.div
                    className="bg-card rounded-xl p-6 md:p-8 border border-neutral-100 group-hover:border-primary/20 dark:border-transparent dark:group-hover:border-transparent transition-colors duration-200 h-full"
                    initial={{ boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                    whileHover={{ boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.2)", transition: { duration: 0.2 } }}
                >
                    <div className="flex items-center gap-6 md:gap-8">
                    <div className="flex-shrink-0 flex items-center justify-center">
                        <div className="h-12 sm:h-14 lg:h-16 w-auto">
                        {renderLogo(app.title)}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="text-xl font-bold group-hover:text-primary transition-colors duration-200">
                        {renderTitle(app.title)}
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm max-w-none">
                        {t(app.descriptionKey as any)}
                        </p>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1">
                        <span className="material-symbols-outlined text-3xl text-primary">
                        arrow_forward
                        </span>
                    </div>
                    </div>
                </motion.div>
                </motion.a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuiteSection;