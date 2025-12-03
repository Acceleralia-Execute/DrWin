// FIX: Replaced placeholder content with a complete, functional Header component.
// This resolves the module loading error in App.tsx and all other reported errors.
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../context/ThemeContext';
import { GrantswinLogo } from '../assets/GrantswinLogo';
import { GrantswinTextLogo } from '../assets/GrantswinTextLogo';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Button } from './ui/Button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './ui/Tooltip';
import { translations, Language } from '../lib/i18n';
import { cn } from '../lib/utils';


interface HeaderProps {
  onSupportClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSupportClick }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="px-4 sm:px-6 lg:px-12 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-6 sm:h-8 lg:h-10" style={{ aspectRatio: '78 / 49' }}>
            <GrantswinLogo />
          </div>
          <div className="h-4 sm:h-5 lg:h-6" style={{ aspectRatio: '277 / 27' }}>
            <GrantswinTextLogo />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="text-neutral-600 dark:text-neutral-300">
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

          <DropdownMenu>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" aria-label="Change language" className="h-10 px-2.5 gap-1.5 text-neutral-600 dark:text-neutral-300">
                                <span className="material-symbols-outlined text-xl">language</span>
                                <span className="font-semibold text-sm">{(translations[language] as any)?.['language.self'] || language.toUpperCase()}</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('tooltip.change_language')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="w-40" align="end">
                <DropdownMenuLabel>{t('language.select')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(translations) as Array<keyof typeof translations>).map((langKey) => (
                <DropdownMenuItem key={langKey} onClick={() => setLanguage(langKey)}>
                    <div className="flex items-center justify-between w-full">
                    <span className={cn(language === langKey && 'font-semibold')}>
                        {(translations[langKey] as any)['language.self']}
                    </span>
                    {language === langKey && <span className="material-symbols-outlined text-base text-primary">check</span>}
                    </div>
                </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full text-neutral-600 dark:text-neutral-300">
                <Avatar>
                  <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User avatar" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{t('header.user.name')}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {t('header.user.email')}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="material-symbols-outlined text-base mr-2">person</span>
                <span>{t('header.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="material-symbols-outlined text-base mr-2">settings</span>
                <span>{t('header.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSupportClick}>
                <span className="material-symbols-outlined text-base mr-2">help</span>
                <span>{t('header.help')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="material-symbols-outlined text-base mr-2">logout</span>
                <span>{t('header.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;