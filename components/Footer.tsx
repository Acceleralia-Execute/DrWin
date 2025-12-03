import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { GrantswinLogo } from '../assets/GrantswinLogo';
import { GrantswinTextLogo } from '../assets/GrantswinTextLogo';

interface FooterProps {
    onSupportClick: () => void;
}

const Footer: React.FC<FooterProps> = ({ onSupportClick }) => {
  const { t } = useLanguage();

  return (
    <footer className="px-6 lg:px-12 py-8 bg-secondary text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="h-6 flex-shrink-0" style={{ aspectRatio: '78 / 49' }}> {/* height: 24px */}
              <GrantswinLogo />
            </div>
            <div>
              <div className="h-3" style={{ aspectRatio: '277 / 27' }}> {/* height: 12px */}
                <GrantswinTextLogo grantsClass="fill-white" winFill="white" />
              </div>
              <p className="text-sm opacity-75 mt-1">{t('footer.tagline')}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={onSupportClick}
              className="px-6 py-2 rounded-lg font-medium text-sm transition-colors duration-200 hover:opacity-90 bg-primary text-white flex items-center"
            >
              <span className="material-symbols-outlined text-sm mr-2 align-middle">support_agent</span>
              {t('footer.support')}
            </button>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-neutral-600 text-center">
          <p className="text-xs text-neutral-400">v.1.0 - {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;