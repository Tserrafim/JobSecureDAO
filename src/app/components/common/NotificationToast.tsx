import { Toast, Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

export function NotificationToast() {
  return (
    <Toaster position="top-right">
      {(t: Toast) => (
        <div className={`neumorphic-toast ${t.visible ? 'animate-in' : 'animate-out'}`}>
          <div className="flex items-start">
            {t.type === 'success' && <CheckCircle className="mr-3 text-green-500" />}
            {t.type === 'error' && <XCircle className="mr-3 text-red-500" />}
            {t.type === 'info' && <Info className="mr-3 text-blue-500" />}
            {t.type === 'warning' && <AlertTriangle className="mr-3 text-yellow-500" />}
            
            <div className="flex-1">
              {t.message && (
                <p className="font-medium">
                  {typeof t.message === 'string' ? t.message : null}
                </p>
              )}
              {t.message?.subtext && (
                <p className="mt-1 text-neumorph-text-secondary text-sm">
                  {t.message.subtext}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Toaster>
  );
}

// Supporting CSS in neumorphic.css:
/*
.neumorphic-toast {
  background: var(--neumorph-bg);
  border-radius: 12px;
  box-shadow: var(--neumorph-shadow);
  padding: 16px;
  max-width: 350px;
}
*/