'use client';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  MessageSquare,
  Tag,
  CheckCircle2,
  XCircle,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-utils';

interface Campaign {
  id: string;
  name: string;
  keywords: string[];
  matchType: 'exact' | 'contains';
  replyTemplate: string;
  isActive: boolean;
  createdAt: any;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    matchType: 'exact' as 'exact' | 'contains',
    replyTemplate: '',
    isActive: true
  });

  useEffect(() => {
    if (!user) return;
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const q = query(
        collection(db, 'campaigns'), 
        where('userId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setCampaigns(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const keywordsArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k !== '');
    const data = {
      ...formData,
      keywords: keywordsArray,
      userId: user.uid,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingCampaign) {
        await updateDoc(doc(db, 'campaigns', editingCampaign.id), data);
      } else {
        await addDoc(collection(db, 'campaigns'), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingCampaign(null);
      setFormData({ name: '', keywords: '', matchType: 'exact', replyTemplate: '', isActive: true });
      fetchCampaigns();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'campaigns');
    }
  };

  const toggleStatus = async (campaign: Campaign) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), {
        isActive: !campaign.isActive
      });
      fetchCampaigns();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${campaign.id}`);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      fetchCampaigns();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `campaigns/${id}`);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-slate-500">Manage your automated reply rules and keywords.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCampaign(null);
            setFormData({ name: '', keywords: '', matchType: 'exact', replyTemplate: '', isActive: true });
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search campaigns or keywords..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-pulse h-48"></div>
          ))
        ) : filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => (
            <motion.div 
              layout
              key={campaign.id}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${campaign.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{campaign.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${campaign.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {campaign.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                        {campaign.matchType}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(campaign)}
                    className={`p-2 rounded-xl transition-colors ${campaign.isActive ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
                  >
                    {campaign.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingCampaign(campaign);
                      setFormData({
                        name: campaign.name,
                        keywords: campaign.keywords.join(', '),
                        matchType: campaign.matchType,
                        replyTemplate: campaign.replyTemplate,
                        isActive: campaign.isActive
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Keywords
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.keywords.map((k, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Reply Template
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2 italic">
                    &quot;{campaign.replyTemplate}&quot;
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Megaphone className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No campaigns found</h3>
            <p className="text-slate-500 mb-8">Start by creating your first automation campaign.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Create Campaign
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Summer Sale Promo"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Keywords (comma separated)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. price, link, info, details"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    />
                    <p className="text-[10px] text-slate-400 mt-2">Separate multiple keywords with commas.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Match Type</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                        value={formData.matchType}
                        onChange={(e) => setFormData({ ...formData, matchType: e.target.value as any })}
                      >
                        <option value="exact">Exact Match</option>
                        <option value="contains">Contains Keyword</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div 
                          onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Active</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Reply Template</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Hey! Thanks for your interest. Here's the link: https://example.com"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
                      value={formData.replyTemplate}
                      onChange={(e) => setFormData({ ...formData, replyTemplate: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 text-slate-600 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      {editingCampaign ? 'Save Changes' : 'Create Campaign'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
