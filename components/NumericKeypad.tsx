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
    <div className="flex flex-col gap-3 pt-4 pb-2">
      <div className="grid grid-cols-3 gap-3">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className="h-14 rounded-2xl text-2xl font-medium active:scale-95 transition-all shadow-sm backdrop-blur-md
              bg-white/70 dark:bg-slate-800/40
              hover:bg-white/90 dark:hover:bg-slate-800/60
              text-slate-800 dark:text-white
              border border-white/40 dark:border-white/5"
          >
            {key}
          </button>
        ))}
        <button
          onClick={onDelete}
          className="h-14 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-sm backdrop-blur-md
             bg-white/70 dark:bg-slate-800/40
             hover:bg-red-50/80 dark:hover:bg-red-900/30
             text-slate-800 dark:text-white
             border border-white/40 dark:border-white/5"
        >
          <Delete size={24} />
        </button>
      </div>

      {onNext && (
        <button 
          onClick={onNext}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {nextLabel}
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
};