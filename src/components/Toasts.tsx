import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastMessage = {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
};

type ToastListProps = {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
};

export default function ToastList({ toasts, onDismiss }: ToastListProps) {
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(toasts[0].id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col space-y-2 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-xl pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100 ${
            t.type === 'error' ? 'bg-red-500 text-white' : 
            t.type === 'success' ? 'bg-green-600 text-white' : 
            'bg-slate-700 text-white border border-slate-600'
          }`}
        >
          {t.type === 'error' && <AlertCircle size={20} />}
          {t.type === 'success' && <CheckCircle size={20} />}
          {t.type === 'info' && <Info size={20} />}
          <p className="font-medium text-sm">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
