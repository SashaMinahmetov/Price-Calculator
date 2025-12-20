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
            className="h-14 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-2xl font-semibold active:scale-95 transition-all shadow-sm border-b-2 border-slate-900 active:border-b-0"
          >
            {key}
          </button>
        ))}
        <button
          onClick={onDelete}
          className="h-14 rounded-xl bg-slate-700 hover:bg-red-900/50 text-white flex items-center justify-center active:scale-95 transition-all shadow-sm border-b-2 border-slate-900 active:border-b-0"
        >
          <Delete size={24} />
        </button>
      </div>

      {onNext && (
        <button 
          onClick={onNext}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {nextLabel}
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
};