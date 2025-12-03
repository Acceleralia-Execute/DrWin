
import React from 'react';
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

interface HeaderToolbarProps {
    onSupportClick: () => void;
}

export const HeaderToolbar: React.FC<HeaderToolbarProps> = ({ onSupportClick }) => {
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { settings } = useSettings();

    const languages = [
        { code: 'es', label: 'Español' },
        { code: 'ca', label: 'Català' },
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'it', label: 'Italiano' },
    ];

    return (
        <div className="flex items-center justify-end p-4 space-x-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b border-border">
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
                                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground px-2">
                                    <span className="material-symbols-outlined text-xl">language</span>
                                    <span className="uppercase text-sm font-semibold">{language}</span>
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
                            <span className="flex items-center justify-between w-full">
                                {lang.label} 
                                {language === lang.code && <span className="material-symbols-outlined text-sm ml-2">check</span>}
                            </span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Bug Report */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
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
                    <Button variant="ghost" size="icon" className="rounded-full ml-2">
                         <Avatar className="h-8 w-8">
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
    );
};
