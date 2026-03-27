'use client';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Clock, 
  Zap, 
  AlertCircle, 
  User as UserIcon,
  MessageSquare,
  Instagram
} from 'lucide-react';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: any;
}

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const q = query(
        collection(db, 'logs'), 
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Activity Logs</h1>
          <p className="text-slate-500">Track all automated actions and system events.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-6 animate-pulse bg-slate-50/20 h-20"></div>
            ))
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                <div className={`p-2 rounded-xl shrink-0 ${
                  log.action.includes('SENT') ? 'bg-emerald-50 text-emerald-600' : 
                  log.action.includes('ERROR') ? 'bg-red-50 text-red-600' : 
                  'bg-indigo-50 text-indigo-600'
                }`}>
                  {log.action.includes('SENT') ? <MessageSquare className="w-5 h-5" /> : 
                   log.action.includes('ERROR') ? <AlertCircle className="w-5 h-5" /> : 
                   <Zap className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</h4>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.createdAt?.toDate ? format(log.createdAt.toDate(), 'MMM d, HH:mm:ss') : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{log.details}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No activity logs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
