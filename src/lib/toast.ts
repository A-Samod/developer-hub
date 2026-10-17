import { toast as sonnerToast } from 'sonner';

export function toastSuccess(message: string) {
  sonnerToast.success(message);
}

export function toastError(message: string) {
  sonnerToast.error(message);
}

export function toastUndo(message: string, onUndo: () => void | Promise<void>) {
  sonnerToast(message, {
    action: {
      label: 'Undo',
      onClick: () => {
        void onUndo();
      },
    },
  });
}

export function toastInfo(message: string) {
  sonnerToast(message);
}
