import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, ChevronLeft, RefreshCcw, Activity } from 'lucide-react';
import { Translation } from '../translations';

interface UserData {
  id: string;
  telegramId: number;
  firstName: string;
  lastName: string;
  username: string;
  languageCode: string;
  lastVisit: string;
  visitCount: number;
  role: string;
}

export const AdminPanel: React.FC<{ onBack: () => void, t: Translation }> = ({ onBack, t }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('lastVisit', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as UserData);
      });
      
      setUsers(usersData);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Users size={24} className="text-blue-500" />
          Admin Panel
        </h2>
        <button 
          onClick={fetchUsers}
          className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-700/60 transition-all text-slate-500 dark:text-slate-400"
          disabled={loading}
        >
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/40 border border-white/50 dark:border-white/5 shadow-sm flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{users.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">Total Users</div>
        </div>
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/40 border border-white/50 dark:border-white/5 shadow-sm flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {users.reduce((acc, user) => acc + (user.visitCount || 0), 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mt-1">Total Visits</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            No users found.
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/30 border border-white/40 dark:border-white/5 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {user.firstName} {user.lastName}
                  </div>
                  {user.username && (
                    <div className="text-xs text-blue-500 dark:text-blue-400">@{user.username}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                  <Activity size={12} />
                  {user.visitCount} visits
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                <div>ID: {user.telegramId}</div>
                <div>{new Date(user.lastVisit).toLocaleDateString()} {new Date(user.lastVisit).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-4">
        <button 
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl bg-white/50 dark:bg-slate-800/40 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-700/60 border border-white/30 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-medium active:scale-95 shadow-sm"
        >
          <ChevronLeft size={18} />
          {t.common.back}
        </button>
      </div>
    </div>
  );
};
