import React from 'react';
import { Delete, ArrowDown } from 'lucide-react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ 
  onKeyPress, 
  onDelete, 
  onNext, 
  nextLabel = "Next" 
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="h-14 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-2xl font-semibold active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-transparent border-b-2 border-b-slate-300 dark:border-b-slate-900 active:border-b active:translate-y-[1px]"
          >
            {key}
          </button>
        ))}
        <button
          onClick={onDelete}
          className="h-14 rounded-xl bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/50 text-slate-800 dark:text-white flex items-center justify-center active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-transparent border-b-2 border-b-slate-300 dark:border-b-slate-900 active:border-b active:translate-y-[1px]"
        >
          <Delete size={24} />
        </button>
      </div>

      {onNext && (
        <button 
          onClick={onNext}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {nextLabel}
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};