import { Toast as ToastType } from '../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const styles = {
    toast: {
      padding: '12px 16px',
      marginBottom: '8px',
      borderRadius: '6px',
      color: 'white',
      cursor: 'pointer',
      minWidth: '200px',
      backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6'
    }
  };

  return (
    <div style={styles.toast} onClick={() => onRemove(toast.id)}>
      {toast.message}
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const styles = {
    container: {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
    }
  };

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}