import { createContext, useContext, useCallback, ReactNode } from 'react'
import { toast as sToast } from 'sonner' // Standardizing on sonner

export type ToastVariant = 'info' | 'success' | 'error'

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    switch (variant) {
      case 'success':
        sToast.success(message);
        break;
      case 'error':
        sToast.error(message);
        break;
      default:
        sToast(message);
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
