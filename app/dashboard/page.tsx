'use client';

import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Megaphone, 
  MessageSquare, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Stats {
  totalLeads: number;
  activeCampaigns: number;
  totalReplies: number;
  conversionRate: number;
}

interface RecentLead {
  id: string;
  commenterUsername: string;
  commentText: string;
  createdAt: any;
  status: string;
}

const data = [
  { name: 'Mon', leads: 4 },
  { name: 'Tue', leads: 7 },
  { name: 'Wed', leads: 5 },
  { name: 'Thu', leads: 12 },
  { name: 'Fri', leads: 8 },
  { name: 'Sat', leads: 15 },
  { name: 'Sun', leads: 10 },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    activeCampaigns: 0,
    totalReplies: 0,
    conversionRate: 0
  });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const leadsQuery = query(collection(db, 'leads'), where('userId', '==', user.uid));
        const campaignsQuery = query(collection(db, 'campaigns'), where('userId', '==', user.uid), where('isActive', '==', true));
        
        const [leadsSnap, campaignsSnap] = await Promise.all([
          getDocs(leadsQuery),
          getDocs(campaignsQuery)
        ]);

        setStats({
          totalLeads: leadsSnap.size,
          activeCampaigns: campaignsSnap.size,
          totalReplies: leadsSnap.docs.filter(d => d.data().status === 'sent').length,
          conversionRate: leadsSnap.size > 0 ? (leadsSnap.docs.filter(d => d.data().status === 'sent').length / leadsSnap.size) * 100 : 0
        });

        // Fetch recent leads
        const recentLeadsQuery = query(
          collection(db, 'leads'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentLeadsSnap = await getDocs(recentLeadsQuery);
        setRecentLeads(recentLeadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentLead)));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back! Here&apos;s what&apos;s happening with your automations.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 text-sm font-medium text-slate-600">
          <Clock className="w-4 h-4" />
          Last updated: Just now
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Total Leads" 
          value={stats.totalLeads} 
          icon={Users} 
          trend="+12.5%" 
          trendUp={true} 
          color="indigo"
          href="/dashboard/leads"
        />
        <StatCard 
          title="Active Campaigns" 
          value={stats.activeCampaigns} 
          icon={Megaphone} 
          trend="Stable" 
          trendUp={true} 
          color="blue"
          href="/dashboard/campaigns"
        />
        <StatCard 
          title="Total Replies" 
          value={stats.totalReplies} 
          icon={MessageSquare} 
          trend="+8.2%" 
          trendUp={true} 
          color="emerald"
          href="/dashboard/logs"
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${stats.conversionRate.toFixed(1)}%`} 
          icon={TrendingUp} 
          trend="-2.1%" 
          trendUp={false} 
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Lead Generation Trend</h3>
            <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#4f46e5' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Leads</h3>
          <div className="space-y-6">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                    {lead.commenterUsername[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">@{lead.commenterUsername}</p>
                    <p className="text-xs text-slate-500 truncate mb-1">&quot;{lead.commentText}&quot;</p>
                    <p className="text-[10px] text-slate-400">
                      {lead.createdAt?.toDate ? formatDistanceToNow(lead.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-2 ${lead.status === 'sent' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">No leads yet.</p>
              </div>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            View All Leads
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color, href }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const content = (
    <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 h-full transition-all hover:shadow-md hover:border-indigo-100 active:scale-[0.98] group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 md:p-3 rounded-2xl transition-colors ${colors[color]} group-hover:bg-indigo-600 group-hover:text-white`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] md:text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-orange-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-xs md:text-sm font-medium mb-1">{title}</p>
      <h4 className="text-xl md:text-2xl font-extrabold text-slate-900">{value}</h4>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
