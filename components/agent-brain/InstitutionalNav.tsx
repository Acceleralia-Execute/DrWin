
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../hooks/useLanguage';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { GrantswinTextLogo } from '../../assets/GrantswinTextLogo';
import { cn } from '../../lib/utils';

interface InstitutionalNavProps {
    onSupportClick: () => void;
}

const apps = [
    { 
        name: 'Grants win', 
        url: 'https://grantswin-user-demo.netlify.app/', 
        icon: 'monetization_on', 
        image: 'https://grantswin.fra1.digitaloceanspaces.com/PUBLIC/logos-suite/SVG/GrantsWin/Horizontal/GrantsWin-horizontal.svg',
        color: 'text-emerald-500' 
    },
    { 
        name: 'Tenders win', 
        url: 'https://tenderswin-home.netlify.app/', 
        icon: 'gavel', 
        image: 'https://grantswin.fra1.digitaloceanspaces.com/PUBLIC/logos-suite/SVG/TendersWin/Horizontal/TendersWin-horizontal.svg',
        color: 'text-blue-500' 
    },
    { 
        name: 'Sales win', 
        url: 'https://grantsales-leads.grantswin.ai/', 
        icon: 'trending_up', 
        image: 'https://grantswin.fra1.digitaloceanspaces.com/PUBLIC/logos-suite/SVG/SalesWin/Horizontal/SalesWin-horizontal.svg',
        color: 'text-violet-500' 
    },
    { 
        name: 'Gov win', 
        url: 'https://govsupply-home.netlify.app/', 
        icon: 'account_balance', 
        image: 'https://grantswin.fra1.digitaloceanspaces.com/PUBLIC/logos-suite/SVG/GovSupply/Horizontal/GovSupply-horizontal.svg',
        color: 'text-amber-500' 
    },
];

export const InstitutionalNav: React.FC<InstitutionalNavProps> = ({ onSupportClick }) => {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { settings } = useSettings();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const languages = [
        { code: 'es', label: 'Español' },
        { code: 'ca', label: 'Català' },
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'it', label: 'Italiano' },
    ];

    return (
        <>
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b border-border h-16">
                
                {/* Left: Menu & Branding */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
                        <span className="material-symbols-outlined text-2xl">menu</span>
                    </Button>
                </div>

                {/* Right: Toolbar Items */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                    {/* Theme Toggle */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-muted-foreground hover:text-foreground">
                                    <span className="material-symbols-outlined text-xl">
                                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('tooltip.toggle_theme')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Language Selector */}
                    <DropdownMenu>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground px-2 h-9">
                                            <span className="material-symbols-outlined text-xl">language</span>
                                            <span className="uppercase text-xs font-bold">{language}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('tooltip.change_language')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent align="end">
                            {languages.map((lang) => (
                                <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as any)}>
                                    <span className="flex items-center justify-between w-full gap-2">
                                        {lang.label} 
                                        {language === lang.code && <span className="material-symbols-outlined text-sm">check</span>}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Bug Report */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
                                    <span className="material-symbols-outlined text-xl">bug_report</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('header.report_bug') || 'Report Bug'}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Support */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onSupportClick} className="text-muted-foreground hover:text-foreground">
                                    <span className="material-symbols-outlined text-xl">headset_mic</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('header.help')}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full ml-1">
                                <Avatar className="h-8 w-8 border border-border">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${settings.account.name}`} />
                                    <AvatarFallback>{settings.account.name ? settings.account.name.charAt(0) : 'U'}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{settings.account.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <span className="material-symbols-outlined mr-2 text-base">edit</span>
                                {t('header.profile')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span className="material-symbols-outlined mr-2 text-base">logout</span>
                                {t('header.logout')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Offcanvas Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />
                        
                        {/* Panel */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-background border-r border-border shadow-2xl flex flex-col"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <div className="h-6 w-32">
                                    <GrantswinTextLogo />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                                    <span className="material-symbols-outlined">close</span>
                                </Button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto py-6 px-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                                    GrantsWin Suite
                                </h3>
                                <div className="space-y-2">
                                    {apps.map((app) => (
                                        <a
                                            key={app.name}
                                            href={app.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors group"
                                        >
                                            <div className={cn("w-10 h-10 rounded-md flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 group-hover:bg-background border border-transparent group-hover:border-border transition-colors overflow-hidden", app.color)}>
                                                {app.image ? (
                                                    <img src={app.image} alt={app.name} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-2xl">{app.icon}</span>
                                                )}
                                            </div>
                                            <span className="font-medium text-sm">{app.name}</span>
                                            <span className="material-symbols-outlined text-muted-foreground ml-auto text-sm opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-t border-border bg-neutral-50 dark:bg-neutral-900/30">
                                <p className="text-xs text-muted-foreground text-center">
                                    © 2024 GrantsWin.AI
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
