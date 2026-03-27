'use client';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Instagram,
  Tag,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';

interface Lead {
  id: string;
  commenterUsername: string;
  commentText: string;
  matchedKeyword: string;
  mediaId: string;
  status: 'sent' | 'failed' | 'pending';
  failureReason?: string;
  createdAt: any;
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    try {
      const q = query(
        collection(db, 'leads'), 
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.commenterUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.commentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.matchedKeyword?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportLeads = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Username,Comment,Keyword,Status,Date\n"
      + filteredLeads.map(l => `${l.commenterUsername},"${l.commentText}",${l.matchedKeyword},${l.status},${l.createdAt?.toDate ? format(l.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Leads</h1>
          <p className="text-slate-500">View and manage the leads captured from your automations.</p>
        </div>
        <button 
          onClick={exportLeads}
          className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by username, comment, or keyword..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Commenter</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Comment</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Keyword</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 h-16 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                          {lead.commenterUsername[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900">@{lead.commenterUsername}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-xs truncate italic">&quot;{lead.commentText}&quot;</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {lead.matchedKeyword}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {lead.status === 'sent' ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : lead.status === 'failed' ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full group-hover:relative group-hover:cursor-help">
                            <XCircle className="w-3 h-3" /> Failed
                            <span className="hidden group-hover:block absolute bottom-full left-0 mb-2 p-2 bg-slate-900 text-white text-[10px] rounded-lg w-48 z-10">
                              {lead.failureReason || 'Unknown error'}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 font-medium">
                        {lead.createdAt?.toDate ? format(lead.createdAt.toDate(), 'MMM d, HH:mm') : 'Just now'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`https://instagram.com/reels/${lead.mediaId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors inline-block"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No leads found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
