import { AppView } from '../types';

export interface HistoryItem {
  id: string;
  view: AppView;
  title: string;
  details: string;
  result: string;
  timestamp: number;
}

export const getHistory = (): HistoryItem[] => {
  try {
    const data = localStorage.getItem('calc_history');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
  };
  const newHistory = [newItem, ...history].slice(0, 50);
  localStorage.setItem('calc_history', JSON.stringify(newHistory));
};

export const clearHistory = () => {
  localStorage.removeItem('calc_history');
};
