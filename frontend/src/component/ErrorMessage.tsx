
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ error, onDismiss }:any) => {
  if (!error) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-destructive mb-1">Error</h4>
          <p className="text-sm text-foreground">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-destructive hover:text-destructive/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

