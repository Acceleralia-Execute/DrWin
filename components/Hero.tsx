import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import DrWinIcon from '../assets/DrWinIcon';

const Hero: React.FC = () => {
    const { t } = useLanguage();

    const HeroTitle: React.FC = () => {
        const title = t('hero.title');
        const parts = title.split('GrantsWin');
        return (
            <h1 className="text-white text-3xl lg:text-5xl font-semibold leading-tight mb-3">
                {parts[0]}
                <span className="font-bold">GrantsWin</span>
                {parts[1]}
            </h1>
        )
    }

    return (
        <section className="px-4 sm:px-6 lg:px-12 py-6 pt-[24px] pr-[48px] pb-[8px] pl-[48px]">
            <div className="relative rounded-2xl p-6 py-8 md:p-8 mb-8 flex items-center justify-center bg-primary" style={{ minHeight: '216px' }}>
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="absolute w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-full opacity-10 bg-white" style={{ top: '-20%', left: '-10%' }} />
                    <div className="absolute w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full opacity-15 bg-white" style={{ bottom: '-15%', right: '15%' }} />
                    <div className="absolute w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full opacity-10 bg-white" style={{ top: '10%', right: '30%' }} />
                </div>
                <div className="text-center max-w-md xl:max-w-3xl z-10">
                    <HeroTitle />
                    <p className="text-white text-lg lg:text-xl opacity-90">{t('hero.subtitle')}</p>
                </div>
                <div className="absolute bottom-[-5px] right-2 sm:right-4 xl:right-16 w-[72px] h-[72px] sm:w-[120px] sm:h-[120px] xl:w-[240px] xl:h-[240px]">
                    <DrWinIcon alt="GrantsWin AI Robot" className="w-full h-full object-contain" />
                </div>
            </div>
        </section>
    );
};

export default Hero;