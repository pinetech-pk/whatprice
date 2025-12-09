'use client';

import React from 'react';
import { AlertCircle, XCircle, RefreshCw, AlertTriangle, Info } from 'lucide-react';

type ErrorVariant = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: ErrorVariant;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  fullPage?: boolean;
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
    iconColor: 'text-red-500',
    button: 'bg-red-100 hover:bg-red-200 text-red-700',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
    button: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
  },
};

export function ErrorMessage({
  title,
  message,
  variant = 'error',
  onRetry,
  onDismiss,
  className = '',
  fullPage = false,
}: ErrorMessageProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  const content = (
    <div
      className={`rounded-lg border p-4 ${styles.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm">{message}</p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${styles.button}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="max-w-md w-full">{content}</div>
      </div>
    );
  }

  return content;
}

// Inline error for form fields
interface FieldErrorProps {
  message: string;
  className?: string;
}

export function FieldError({ message, className = '' }: FieldErrorProps) {
  return (
    <p className={`text-sm text-red-600 mt-1 flex items-center gap-1 ${className}`}>
      <AlertCircle className="w-3.5 h-3.5" />
      {message}
    </p>
  );
}

// Toast-style error notification
interface ToastErrorProps {
  message: string;
  onClose?: () => void;
  duration?: number;
}

export function ToastError({ message, onClose, duration = 5000 }: ToastErrorProps) {
  React.useEffect(() => {
    if (onClose && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
        <XCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm flex-1">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Full page error for critical errors
interface FullPageErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function FullPageError({
  title = 'Something went wrong',
  message,
  onRetry,
}: FullPageErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
