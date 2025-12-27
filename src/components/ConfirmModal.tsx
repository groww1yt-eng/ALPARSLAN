import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = 'Are you sure?',
  message = "This action can't be undone. Please confirm if you want to proceed.",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
        
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
