import React from 'react';
import { Delete } from 'lucide-react';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear?: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({ onKeyPress, onDelete, onClear }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="grid grid-cols-3 gap-3 pt-2">
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
  );
};