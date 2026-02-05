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
        className={`relative w-full bg-white dark:bg-slate-800 border rounded-xl px-3 py-2.5 transition-all cursor-pointer flex items-center shadow-sm
          ${isActive 
            ? 'border-blue-500 ring-1 ring-blue-500 z-10' 
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
      >
        <div className="flex-1 flex items-center justify-between overflow-hidden">
          {/* Reduced min-h and font-size to make it more compact */}
          <span className={`text-base font-medium leading-6 min-h-[24px] ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
            {value || props.placeholder || ''}
          </span>
          {suffix && (
            <span className="text-slate-400 dark:text-slate-500 ml-2 pointer-events-none whitespace-nowrap text-sm">
              {suffix}
            </span>
          )}
        </div>
        
        {/* Hidden input to maintain accessibility if needed, but visually we use the div */}
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