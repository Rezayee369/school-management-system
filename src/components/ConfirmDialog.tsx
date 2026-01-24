'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            dialogRef.current?.focus();
        }
    }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-scale"
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-background/80 border border-secondary/30 p-8 rounded-2xl shadow-2xl shadow-primary/10 w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the dialog
        tabIndex={-1} // Make the dialog focusable
      >
        <h2 id="dialog-title" className="text-2xl font-bold text-foreground mb-2">
            {title}
        </h2>
        <p className="text-muted-foreground mb-6">
            {description}
        </p>
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 font-semibold text-muted-foreground bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 font-semibold text-white bg-destructive rounded-lg shadow-md hover:bg-destructive/80 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
