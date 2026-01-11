import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', icon: Icon, isLoading, className = '', ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20",
    ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-card",
    outline: "border-2 border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? <Icon className="w-5 h-5 mr-2" /> : null}
      {children}
    </button>
  );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 ${className}`}
  >
    {children}
  </div>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>}
    <input
      className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all ${className}`}
      {...props}
    />
  </div>
);

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-dark-card z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Confirmation Modal ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  variant?: 'danger' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Confirm', cancelText = 'Cancel', showCancel = true, variant = 'primary'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex gap-3 justify-end">
          {showCancel && (
            <Button variant="ghost" onClick={onClose} size="sm">
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => { onConfirm(); onClose(); }}
            size="sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Swipe Button ---
interface SwipeButtonProps {
  onSwipe: () => void;
  text?: string;
  className?: string;
}

export const SwipeButton: React.FC<SwipeButtonProps> = ({ onSwipe, text = "SWIPE TO START", className = "" }) => {
  const [dragX, setDragX] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLDivElement>(null);

  const handleStart = () => setIsSwiping(true);

  const handleMove = (clientX: number) => {
    if (!isSwiping || !containerRef.current || !handleRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const handleWidth = handleRef.current.offsetWidth;
    const maxX = containerRect.width - handleWidth - 8;

    let newX = clientX - containerRect.left - (handleWidth / 2);
    newX = Math.max(0, Math.min(newX, maxX));
    setDragX(newX);

    if (newX >= maxX * 0.95) {
      setIsSwiping(false);
      setDragX(maxX);
      onSwipe();
    }
  };

  const handleEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (dragX < (containerRef.current?.offsetWidth || 0) * 0.8) {
      setDragX(0);
    }
  };

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    if (isSwiping) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isSwiping, dragX]);

  const containerWidth = containerRef.current?.offsetWidth || 1;
  const progressPercent = (dragX / (containerWidth - 64)) * 100;

  return (
    <div
      ref={containerRef}
      className={`relative h-16 bg-slate-900/50 dark:bg-black/40 rounded-2xl overflow-hidden border border-white/5 shadow-inner backdrop-blur-md ${className}`}
    >
      {/* Background Hyper-Speed Starfield */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black/20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute h-[1px] bg-gradient-to-r from-transparent via-white/40 to-white/10 ${isSwiping ? 'animate-spark-fast' : 'animate-spark-slow'}`}
            style={{
              top: `${Math.random() * 100}%`,
              left: '-50px',
              width: isSwiping ? `${Math.random() * 100 + 100}px` : `${Math.random() * 40 + 20}px`,
              opacity: Math.random() * 0.5 + 0.2,
              animationDelay: `${Math.random() * 2000}ms`,
              animationDuration: isSwiping ? `${Math.random() * 300 + 200}ms` : `${Math.random() * 1000 + 1000}ms`,
            }}
          />
        ))}
      </div>

      {/* Background Text with Shimmer/Progress */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="relative">
          <span className="text-white/10 font-black text-sm tracking-[0.2em] uppercase select-none">
            {text}
          </span>
          <span
            className="absolute inset-0 text-white/50 font-black text-sm tracking-[0.2em] uppercase select-none overflow-hidden transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          >
            <span className="whitespace-nowrap">{text}</span>
          </span>
        </span>
      </div>

      {/* Reactive Glow behind handle */}
      <div
        className="absolute w-24 h-24 bg-primary-500/30 blur-2xl rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          left: dragX - 20,
          top: -20,
          opacity: isSwiping ? 1 : 0.3
        }}
      />

      {/* Progress gradient track */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary-600/30 via-primary-500/10 to-transparent transition-all duration-75"
        style={{ width: dragX + 48 }}
      />

      {/* Handle */}
      <div
        ref={handleRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{ transform: `translateX(${dragX}px)` }}
        className={`absolute left-1 top-1 bottom-1 w-14 bg-primary-500 rounded-xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-75 group 
          ${isSwiping ? 'scale-105 shadow-primary-500/50' : 'animate-guidance-nudge shadow-md'}`}
      >
        <div className="flex gap-0.5 relative">
          <ChevronRight size={20} className={`text-white stroke-[3px] transition-transform ${isSwiping ? 'animate-pulse scale-110' : ''}`} />
          <ChevronRight size={20} className={`text-white/40 stroke-[3px] -ml-2.5 transition-all ${isSwiping ? 'animate-pulse delay-75' : ''}`} />

          {/* Subtle wing effect on handle */}
          {isSwiping && (
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full animate-ping pointer-events-none" />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spark-motion {
          0% { transform: translateX(0) scaleX(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(600px) scaleX(2); opacity: 0; }
        }
        .animate-spark-slow {
          animation: spark-motion linear infinite;
        }
        .animate-spark-fast {
          animation: spark-motion linear infinite;
        }
        @keyframes guidance-nudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(12px); }
        }
        .animate-guidance-nudge {
          animation: guidance-nudge 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};