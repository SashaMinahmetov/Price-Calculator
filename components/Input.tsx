import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  suffix?: string;
  isActive?: boolean;
  onInputClick?: () => void;
  value: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  suffix, 
  className = '', 
  isActive = false,
  onInputClick,
  value,
  ...props 
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className={`text-xs font-medium ml-1 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
        {label}
      </label>
      <div 
        onClick={onInputClick}
        className={`relative w-full rounded-xl px-3 py-3 transition-all cursor-pointer flex items-center shadow-sm backdrop-blur-md
          ${isActive 
            ? 'bg-white dark:bg-slate-800 border-blue-500 ring-1 ring-blue-500 z-10' 
            : 'bg-white/60 dark:bg-slate-800/40 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-800/60 border'
          }`}
      >
        <div className="flex-1 flex items-center justify-between overflow-hidden">
          <span className={`text-lg font-medium leading-6 min-h-[24px] ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
            {value || props.placeholder || ''}
          </span>
          {suffix && (
            <span className="text-slate-400 dark:text-slate-500 ml-2 pointer-events-none whitespace-nowrap text-sm font-medium">
              {suffix}
            </span>
          )}
        </div>
        
        {/* Hidden input to maintain accessibility */}
        <input 
          className="sr-only"
          readOnly
          tabIndex={-1}
          {...props}
        />
      </div>
    </div>
  );
};