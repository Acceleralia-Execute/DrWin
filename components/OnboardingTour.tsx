import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface TourStep {
    target: string;
    titleKey: any;
    contentKey: any;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    interactive?: boolean;
    preDelay?: number;
}

interface OnboardingTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onComplete: () => void;
    onRequestClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onComplete, onRequestClose }) => {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
    const tooltipRef = useRef<HTMLDivElement>(null);

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isInteractiveStep = step?.interactive;

    const handleNext = useCallback(() => {
        setTargetRect(null);
        setCurrentStep(s => {
            if (s >= steps.length - 1) {
                onComplete();
                return s;
            }
            return s + 1;
        });
    }, [steps.length, onComplete]);

    const handleBack = () => {
        setTargetRect(null);
        if (currentStep > 0) {
            setCurrentStep(s => s - 1);
        }
    };

    useLayoutEffect(() => {
        if (!isOpen || !step) return;

        const findAndSetTarget = () => {
            if (step.target) {
                const element = document.querySelector(step.target) as HTMLElement | null;
                if (element) {
                    element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
                    setTargetRect(element.getBoundingClientRect());
                    return true;
                }
            } else {
                setTargetRect(null); // For centered steps without a target
                return true;
            }
            return false;
        };
        
        const timeoutId = setTimeout(() => {
            if (!findAndSetTarget()) {
                console.warn(`Tour target not found: ${step.target}. Skipping step.`);
                handleNext();
            }
        }, step.preDelay || 50);

        return () => clearTimeout(timeoutId);
    }, [currentStep, isOpen, step, handleNext]);

    useLayoutEffect(() => {
        if (!isOpen) return;

        const handlePositioning = () => {
            if (!tooltipRef.current) return;

            const tooltipEl = tooltipRef.current;
            const tooltipRect = tooltipEl.getBoundingClientRect();
            const offset = 16;
            const viewportPadding = 16;
            
            if (!targetRect || step.position === 'center') {
                setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
                setArrowStyle({ display: 'none' });
                return;
            }

            let placements = [step.position];
            if (step.position === 'top') placements.push('bottom');
            if (step.position === 'bottom') placements.push('top');
            if (step.position === 'left') placements.push('right');
            if (step.position === 'right') placements.push('left');

            let finalPlacement = step.position;
            let top = 0, left = 0;

            for (const placement of placements) {
                finalPlacement = placement;
                let trialTop = 0, trialLeft = 0;

                switch (placement) {
                    case 'bottom':
                        trialTop = targetRect.bottom + offset;
                        trialLeft = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                        break;
                    case 'top':
                        trialTop = targetRect.top - offset - tooltipRect.height;
                        trialLeft = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
                        break;
                    case 'left':
                        trialTop = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                        trialLeft = targetRect.left - offset - tooltipRect.width;
                        break;
                    case 'right':
                        trialTop = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
                        trialLeft = targetRect.right + offset;
                        break;
                }

                // Clamp to viewport
                trialLeft = Math.max(viewportPadding, Math.min(trialLeft, window.innerWidth - tooltipRect.width - viewportPadding));
                trialTop = Math.max(viewportPadding, Math.min(trialTop, window.innerHeight - tooltipRect.height - viewportPadding));

                top = trialTop;
                left = trialLeft;
                
                // A simple check if the position is good enough
                if ( (placement === 'bottom' && top > targetRect.bottom) ||
                     (placement === 'top' && top + tooltipRect.height < targetRect.top) ||
                     (placement === 'left' && left + tooltipRect.width < targetRect.left) ||
                     (placement === 'right' && left > targetRect.right) ) {
                    break; 
                }
            }

            setTooltipStyle({ top: `${top}px`, left: `${left}px` });
            
            // Arrow positioning
            const arrowSize = 8;
            let arrowTop = 'auto', arrowLeft = 'auto', arrowRight = 'auto', arrowBottom = 'auto';
            
            const targetCenterX = targetRect.left + targetRect.width / 2;
            const clampedArrowLeft = Math.max(left + arrowSize, Math.min(targetCenterX, left + tooltipRect.width - arrowSize));

            if (finalPlacement === 'top') {
                arrowBottom = `${-arrowSize}px`;
                arrowLeft = `${clampedArrowLeft - left - arrowSize}px`;
            } else if (finalPlacement === 'bottom') {
                arrowTop = `${-arrowSize}px`;
                arrowLeft = `${clampedArrowLeft - left - arrowSize}px`;
            } else if (finalPlacement === 'left') {
                arrowRight = `${-arrowSize}px`;
                arrowTop = `${targetRect.top + targetRect.height/2 - top - arrowSize}px`;
            } else if (finalPlacement === 'right') {
                arrowLeft = `${-arrowSize}px`;
                arrowTop = `${targetRect.top + targetRect.height/2 - top - arrowSize}px`;
            }
            
            setArrowStyle({ top: arrowTop, left: arrowLeft, right: arrowRight, bottom: arrowBottom });
        };
        
        handlePositioning();
        window.addEventListener('resize', handlePositioning);
        return () => window.removeEventListener('resize', handlePositioning);

    }, [targetRect, step, isOpen]);


    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onRequestClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onRequestClose]);


    useEffect(() => {
        if (!isOpen || !isInteractiveStep || !step.target) return;
        
        const listener = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handleNext();
        };
        
        const element = document.querySelector(step.target);
        if (element) {
            element.addEventListener('click', listener, { once: true, capture: true });
        }
        
        return () => {
            if (element) {
                element.removeEventListener('click', listener, { capture: true });
            }
        };
    }, [currentStep, isOpen, isInteractiveStep, step?.target, handleNext]);

    if (!isOpen) return null;

    const highlighterAnimation = isInteractiveStep
        ? {
            boxShadow: [
                '0 0 0 4px hsl(var(--brand-button)), 0 0 0 9999px rgba(0,0,0,0.6)',
                '0 0 0 4px hsl(var(--brand-button)), 0 0 20px 4px hsl(var(--brand-button)), 0 0 0 9999px rgba(0,0,0,0.6)',
                '0 0 0 4px hsl(var(--brand-button)), 0 0 0 9999px rgba(0,0,0,0.6)',
            ],
            transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }
        : {
            boxShadow: '0 0 0 4px hsl(var(--brand-button)), 0 0 0 9999px rgba(0,0,0,0.6)',
          };

    return (
        <div className="fixed inset-0 z-[100]" aria-live="polite">
            <AnimatePresence>
                {targetRect ? (
                    <motion.div
                        key={`highlighter-${currentStep}`}
                        layoutId="onboarding-highlight"
                        initial={false}
                        animate={highlighterAnimation}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        className="absolute rounded-lg"
                        style={{
                            x: targetRect.left - 8,
                            y: targetRect.top - 8,
                            width: targetRect.width + 16,
                            height: targetRect.height + 16,
                        }}
                    />
                ) : (
                    <motion.div
                        key="full-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60"
                    />
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {step && (
                    <motion.div
                        ref={tooltipRef}
                        key={`tooltip-${currentStep}`}
                        role="dialog"
                        aria-labelledby="tour-title"
                        aria-describedby="tour-content"
                        tabIndex={-1}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="absolute w-80 max-w-sm p-5 bg-card rounded-lg shadow-2xl"
                        style={tooltipStyle}
                    >
                        <div style={arrowStyle} className="absolute w-4 h-4 bg-card transform rotate-45"></div>
                        <h3 id="tour-title" className="font-bold text-lg mb-2 text-card-foreground">{t(step.titleKey)}</h3>
                        <p id="tour-content" className="text-sm text-muted-foreground">{t(step.contentKey)}</p>
                        
                        <div className="flex items-center justify-between mt-5">
                            <div className="flex gap-1.5">
                                {steps.map((_, index) => (
                                    <div key={index} className={cn(
                                        "w-2 h-2 rounded-full transition-colors",
                                        index === currentStep ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'
                                    )}></div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                {isInteractiveStep && (
                                    <div className="flex items-center gap-1.5 text-xs text-primary animate-pulse font-semibold">
                                        <span className="material-symbols-outlined text-sm">ads_click</span>
                                        <span>{t('onboarding.interactive.wait_prompt')}</span>
                                    </div>
                                )}
                                {currentStep > 0 && <Button variant="ghost" size="sm" onClick={handleBack} disabled={isInteractiveStep}>{t('onboarding.back')}</Button>}
                                <Button size="sm" onClick={handleNext} disabled={isInteractiveStep}>
                                    {isLastStep ? t('onboarding.finish') : t('onboarding.next')}
                                </Button>
                            </div>
                        </div>
                         <Button variant="link" size="sm" className="absolute top-2 right-2 text-muted-foreground" onClick={onRequestClose}>
                            {t('onboarding.skip')}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OnboardingTour;
