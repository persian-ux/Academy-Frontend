import { useEffect } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const toastBase =
  "fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 pointer-events-auto";

const toastStyles: Record<ToastType, string> = {
  success:
    "bg-green-500/20 border-green-500/30 text-green-400",
  error:
    "bg-red-500/20 border-red-500/30 text-red-400",
  info: "bg-blue-500/20 border-blue-500/30 text-blue-400",
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  info: <AlertCircle className="w-5 h-5" />,
};

/**
 * A simple, self-dismissing toast notification.
 * Usage: render <Toast> conditionally; it auto-dismisses after `duration` ms.
 */
export default function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`${toastBase} ${toastStyles[type]}`}>
      {toastIcons[type]}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
