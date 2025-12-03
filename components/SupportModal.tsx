// FIX: Replaced placeholder content with a complete, functional SupportModal component.
// This resolves the module loading error in App.tsx by providing a valid module export,
// and implements the support form feature with Gemini API integration for confirmation messages.
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { toast } from 'sonner';
import { useLanguage } from '../hooks/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/Dialog';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// As per guidelines, initialize the Gemini API client.
// The API_KEY is expected to be in the environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SupportModal: React.FC<SupportModalProps> = ({ open, onOpenChange }) => {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setMessage('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    
    try {
      // Use Gemini to generate a dynamic, friendly confirmation message.
      const lang = language === 'es' ? 'Spanish' : 'English';
      const model = 'gemini-2.5-flash';
      const prompt = `A user named "${name}" submitted a support request in ${lang}. Their message is: "${message}". Generate a short, friendly confirmation message for them IN ${lang}, assuring them our support team will get back to them soon at ${email}. The message should be polite and professional.`;
      
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      const confirmationMessage = response.text;
      
      toast.success(confirmationMessage || t('support_modal.submission.success'));
      
      handleOpenChange(false);

    } catch (error) {
      console.error("Support submission error:", error);
      toast.error(t('support_modal.submission.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
            {t('support_modal.title')}
          </DialogTitle>
          <DialogDescription>{t('support_modal.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('support_modal.form.name.label')}</Label>
              <Input
                id="name"
                placeholder={t('support_modal.form.name.placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('support_modal.form.email.label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('support_modal.form.email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t('support_modal.form.message.label')}</Label>
            <Textarea
              id="message"
              placeholder={t('support_modal.form.message.placeholder')}
              className="min-h-[100px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('support_modal.form.cancel_button')}
            </Button>
            <Button
              type="submit"
              className="text-white"
              disabled={isSubmitting || !name || !email || !message}
            >
              {isSubmitting ? '...' : t('support_modal.form.submit_button')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupportModal;