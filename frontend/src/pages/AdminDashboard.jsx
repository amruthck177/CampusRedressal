import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  LogOut,
  Search,
  SlidersHorizontal,
  TrendingUp,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  FileCheck2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout, API_URL } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list', 'logs'
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all complaints with filters
      const q = [];
      if (statusFilter) q.push(`status=${statusFilter}`);
      if (categoryFilter) q.push(`category=${categoryFilter}`);
      if (priorityFilter) q.push(`priority=${priorityFilter}`);
      if (searchTerm) q.push(`search=${encodeURIComponent(searchTerm)}`);
      
      const queryStr = q.length > 0 ? `?${q.join('&')}` : '';
      const listRes = await axios.get(`${API_URL}/complaints${queryStr}`);
      setComplaints(listRes.data);

      // Fetch analytics
      const analyticRes = await axios.get(`${API_URL}/complaints/analytics`);
      setAnalytics(analyticRes.data);

    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, categoryFilter, priorityFilter]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDashboardData();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Resolved':
        return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/15 text-red-400 border border-red-500/30 font-bold';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
      case 'Low':
        return 'bg-slate-800 text-slate-400 border border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-[-300px] left-[50%] -translate-x-[50%] w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Admin Nav Header */}
      <nav className="glass-panel sticky top-0 z-10 border-b border-slate-800/80 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/20">
            <ShieldCheck className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Campus <span className="text-brand-400">Redressal</span>
            <span className="ml-2 text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/25">ADMIN PANEL</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">System Administrator</div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 mt-8 flex-1">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Administrator Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Review campus grievances, update statuses, audit logs, and view resolution analytics.</p>
        </div>

        {/* Analytics Statistics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                <FileText className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Filed</div>
                <div className="text-xl font-bold text-white mt-0.5">{analytics.statusCounts.total}</div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-amber-500 uppercase tracking-wider font-bold">Pending</div>
                <div className="text-xl font-bold text-amber-400 mt-0.5">{analytics.statusCounts.pending}</div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/25">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">In Progress</div>
                <div className="text-xl font-bold text-blue-400 mt-0.5">{analytics.statusCounts.inProgress}</div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/25">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-brand-500 uppercase tracking-wider font-bold">Resolved</div>
                <div className="text-xl font-bold text-brand-400 mt-0.5">{analytics.statusCounts.resolved}</div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl flex items-center gap-3.5 col-span-2 md:col-span-1">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">Avg Resolve</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {analytics.averageResolutionTimeHours !== 'N/A'
                    ? `${analytics.averageResolutionTimeHours} hrs`
                    : 'No data'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle (List vs Activity Log) */}
        <div className="flex gap-2 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveView('list')}
            className={`py-3 px-4 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
              activeView === 'list'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Active Grievances</span>
          </button>
          <button
            onClick={() => setActiveView('logs')}
            className={`py-3 px-4 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
              activeView === 'logs'
                ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Activity Log</span>
          </button>
        </div>

        {/* VIEW: Complaints List */}
        {activeView === 'list' && (
          <div className="space-y-6">
            {/* Filters panel */}
            <div className="glass-card p-4 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-end border border-slate-850">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Search Complaints</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by keywords..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Academic">Academic</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Ragging/Harassment">Ragging/Harassment</option>
                  <option value="Canteen">Canteen</option>
                  <option value="IT/Library">IT/Library</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Complaints list grid/table */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-2 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
                <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <h3 className="text-slate-400 font-semibold">No complaints match filters</h3>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden border border-slate-850">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-4 px-5">Complaint</th>
                        <th className="py-4 px-5">Category</th>
                        <th className="py-4 px-5">Priority</th>
                        <th className="py-4 px-5">Status</th>
                        <th className="py-4 px-5">Student</th>
                        <th className="py-4 px-5 text-center">Upvotes</th>
                        <th className="py-4 px-5">Filed Date</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {complaints.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-4 px-5 max-w-xs">
                            <div className="font-bold text-slate-200 truncate group-hover:text-brand-400">
                              {c.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{c.description}</div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="bg-slate-800/80 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full text-[10px]">
                              {c.category}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${getPriorityBadge(c.priority)}`}>
                              {c.priority}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(c.status)}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={c.isAnonymous ? 'text-amber-500/80 italic font-medium' : 'text-slate-300 font-medium'}>
                              {c.studentName}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center font-semibold text-slate-300">
                            <div className="flex items-center justify-center gap-1">
                              <ThumbsUp className="w-3 h-3 text-slate-500" />
                              <span>{c.upvotes?.length || 0}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <Link
                              to={`/complaints/${c._id}`}
                              className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/30 py-1.5 px-3 rounded-lg transition-all"
                            >
                              <span>Manage</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: Audit Logs */}
        {activeView === 'logs' && (
          <div className="glass-card rounded-2xl p-5 border border-slate-850">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-400" />
              <span>Activity & Status Change Logs</span>
            </h2>
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
              </div>
            ) : !analytics || analytics.auditLogs?.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No activity logged yet.</div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {analytics.auditLogs.map((log) => (
                  <div key={log._id} className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-200">
                          {log.performedByName}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700 uppercase">
                          {log.performedByRole}
                        </span>
                        <span className="text-slate-500 font-semibold">•</span>
                        <span className="text-brand-400 font-semibold uppercase tracking-wider text-[10px]">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1.5 leading-relaxed">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
//
