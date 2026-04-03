'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalCatches: number;
  protectedCount: number;
  uniqueSpecies: number;
  avgFreshness: string;
  topSpecies: { name: string; count: number; pct: string }[];
  topLocations: { name: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

interface LogEntry {
  id: string;
  title: string;
  details: string;
  timestamp: number;
  is_protected: boolean;
  location?: { lat: number; lng: number; name: string };
  image_urls?: string[];
  user?: { name: string; pfp_url: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'protected' | 'users'>('overview');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/stats'), fetch('/api/logs?limit=50')
      ]);
      const statsData = await statsRes.json();
      const logsData = await logsRes.json();
      if (statsData.success) setStats(statsData.data);
      if (logsData.success) setLogs(logsData.data);
    } catch (e) { console.error('Fetch failed', e); }
    setLoading(false);
  };

  const logout = () => { localStorage.clear(); router.push('/login'); };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
    </div>
  );

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'logs' as const, label: 'Catch Logs', icon: '🐟' },
    { id: 'protected' as const, label: 'Conservation', icon: '🛡️' },
    { id: 'users' as const, label: 'Users', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">AquaVision Monitor</h1>
              <p className="text-slate-500 text-xs">Real-time Fisheries Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-sm hover:bg-white/10 transition">↻ Refresh</button>
            <button onClick={logout} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm hover:bg-red-500/20 transition">Logout</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'logs' && <LogsTab logs={logs} />}
        {activeTab === 'protected' && <ProtectedTab />}
        {activeTab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) return <p className="text-slate-400">No data available</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Catches" value={stats.totalCatches} color="text-white" sub="All synced records" />
        <StatCard label="Unique Species" value={stats.uniqueSpecies} color="text-cyan-400" sub="Detected species" />
        <StatCard label="Protected Alerts" value={stats.protectedCount} color="text-red-400" sub="Conservation flags" />
        <StatCard label="Avg Freshness" value={`${stats.avgFreshness}%`} color="text-green-400" sub="Quality index" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Species */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Species</h3>
          <div className="space-y-3">
            {stats.topSpecies.map((sp, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-slate-500 text-xs font-mono w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-sm">{sp.name}</span>
                    <span className="text-slate-400 text-xs">{sp.count} ({sp.pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${sp.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Top Locations</h3>
          <div className="space-y-3">
            {stats.topLocations.map((loc, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 text-sm">📍</span>
                  <span className="text-white text-sm">{loc.name}</span>
                </div>
                <span className="text-slate-400 text-xs bg-white/5 px-2 py-0.5 rounded-full">{loc.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Daily Catch Trend (30 days)</h3>
        <div className="flex items-end gap-1 h-32">
          {stats.dailyTrend.map((d, i) => {
            const max = Math.max(...stats.dailyTrend.map(x => x.count), 1);
            const h = (d.count / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition">
                  {d.date}: {d.count}
                </div>
                <div className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all" style={{ height: `${h}%`, minHeight: d.count > 0 ? '4px' : '0' }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-white font-semibold">Recent Catch Logs</h3>
        <p className="text-slate-400 text-xs">Synced from AquaVision mobile app</p>
      </div>
      <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className={`p-4 flex gap-4 hover:bg-white/5 transition ${log.is_protected ? 'border-l-2 border-red-500' : ''}`}>
            {log.image_urls?.[0] && <img src={log.image_urls[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-white text-sm font-medium truncate">{log.title}</h4>
                {log.is_protected && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-[10px] rounded-full font-medium">PROTECTED</span>}
              </div>
              <p className="text-slate-400 text-xs mt-0.5 truncate">{log.details}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-slate-500 text-[11px]">{new Date(log.timestamp).toLocaleString()}</span>
                {log.location?.name && <span className="text-slate-500 text-[11px]">📍 {log.location.name}</span>}
                {log.user?.name && <span className="text-slate-500 text-[11px]">👤 {log.user.name}</span>}
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="p-8 text-center text-slate-500">No logs yet. Sync data from the AquaVision app.</div>}
      </div>
    </div>
  );
}

function ProtectedTab() {
  const [data, setData] = useState<{ totalProtectedDetections: number; speciesSummary: { species: string; count: number; lastSeen: string; locations: string[] }[] } | null>(null);
  useEffect(() => {
    fetch('/api/protected-species').then(r => r.json()).then(d => { if (d.success) setData(d.data); });
  }, []);
  if (!data) return <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mt-12" />;
  return (
    <div className="space-y-4">
      <StatCard label="Total Protected Detections" value={data.totalProtectedDetections} color="text-red-400" sub="Wildlife Protection Act flagged species" />
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Protected Species Encounters</h3>
        <div className="space-y-3">
          {data.speciesSummary.map((sp, i) => (
            <div key={i} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-medium">{sp.species}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Last seen: {new Date(sp.lastSeen).toLocaleDateString()}</p>
                  <p className="text-slate-500 text-xs">📍 {sp.locations.join(', ')}</p>
                </div>
                <span className="px-3 py-1 bg-red-500/20 text-red-300 text-sm font-bold rounded-full">{sp.count}</span>
              </div>
            </div>
          ))}
          {data.speciesSummary.length === 0 && <p className="text-slate-500 text-center py-4">No protected species detected yet</p>}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState<{ totalUsers: number; users: { id: string; name: string; totalLogs: number; lastActive: string; protectedCount: number }[] } | null>(null);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { if (d.success) setData(d.data); });
  }, []);
  if (!data) return <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mt-12" />;
  return (
    <div className="space-y-4">
      <StatCard label="Active Users" value={data.totalUsers} color="text-blue-400" sub="Fishermen using AquaVision" />
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/10">
            <th className="text-left text-slate-400 text-xs p-3 font-medium">User</th>
            <th className="text-left text-slate-400 text-xs p-3 font-medium">Total Logs</th>
            <th className="text-left text-slate-400 text-xs p-3 font-medium">Protected</th>
            <th className="text-left text-slate-400 text-xs p-3 font-medium">Last Active</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {data.users.map((u, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="p-3 text-white text-sm">{u.name}</td>
                <td className="p-3 text-slate-300 text-sm">{u.totalLogs}</td>
                <td className="p-3"><span className={`${u.protectedCount > 0 ? 'text-red-400' : 'text-slate-500'} text-sm`}>{u.protectedCount}</span></td>
                <td className="p-3 text-slate-500 text-xs">{new Date(u.lastActive).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
