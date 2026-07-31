
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import type { Toast } from '../../contexts/NotificationContext';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const iconMap = {
  info: <Info className="w-5 h-5 text-blue-400" />,
  success: <CheckCircle className="w-5 h-5 text-green-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  error: <XCircle className="w-5 h-5 text-red-400" />,
};

export function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast: Toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded shadow-lg border",
              "bg-slate-800 border-slate-700 text-slate-200 min-w-[300px]"
            )}
          >
            {iconMap[toast.type]}
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
