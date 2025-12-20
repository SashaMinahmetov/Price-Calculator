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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className={`text-sm font-medium ml-1 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
        {label}
      </label>
      <div 
        onClick={onInputClick}
        className={`relative w-full bg-slate-800 border rounded-xl px-4 py-3 transition-all cursor-pointer
          ${isActive 
            ? 'border-blue-500 ring-1 ring-blue-500 bg-slate-800' 
            : 'border-slate-700 hover:border-slate-600'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-lg ${value ? 'text-white' : 'text-slate-500'}`}>
            {value || props.placeholder || ''}
          </span>
          {suffix && (
            <span className="text-slate-500 ml-2 pointer-events-none">
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