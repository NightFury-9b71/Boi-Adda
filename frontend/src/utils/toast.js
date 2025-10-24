import { toast as sonnerToast } from 'sonner';

// Keep track of active toasts to prevent duplicates
const activeToasts = new Set();

// Custom toast wrapper with deduplication
const createToastMethod = (method) => (message, options = {}) => {
  // Create a unique key for the toast based on message and type
  const toastKey = `${method}-${message}`;
  
  // If this exact toast is already active, don't show it again
  if (activeToasts.has(toastKey)) {
    return;
  }
  
  // Add to active toasts
  activeToasts.add(toastKey);
  
  // Call the original sonner toast method
  const toastId = sonnerToast[method](message, {
    ...options,
    onDismiss: () => {
      // Remove from active toasts when dismissed
      activeToasts.delete(toastKey);
      options.onDismiss?.();
    },
    onAutoClose: () => {
      // Remove from active toasts when auto-closed
      activeToasts.delete(toastKey);
      options.onAutoClose?.();
    }
  });
  
  // Auto-remove from active toasts after a timeout as fallback
  setTimeout(() => {
    activeToasts.delete(toastKey);
  }, options.duration || 4000);
  
  return toastId;
};

// Create our custom toast object with deduplication
export const toast = {
  success: createToastMethod('success'),
  error: createToastMethod('error'),
  info: createToastMethod('info'),
  warning: createToastMethod('warning'),
  loading: createToastMethod('loading'),
  promise: sonnerToast.promise, // Keep promise as is since it has different behavior
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
};

// Export individual methods for convenience
export const { success, error, info, warning, loading } = toast;

export default toast;
