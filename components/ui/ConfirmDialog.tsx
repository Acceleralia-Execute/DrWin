import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './Dialog';
import { Button } from './Button';
import { useLanguage } from '../../hooks/useLanguage';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, onOpenChange, title, description, onConfirm, confirmText, cancelText, variant = 'default' }) => {
  const { t } = useLanguage();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {cancelText || t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant={variant}
              onClick={() => {
                  onConfirm();
                  onOpenChange(false);
              }}
            >
              {confirmText || t('common.confirm')}
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
};