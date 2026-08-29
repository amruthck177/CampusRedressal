import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  LogOut,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  ThumbsUp,
  ChevronRight,
  ShieldCheck,
  Building,
  AlertTriangle
} from 'lucide-react';

const StaffDashboard = () => {
  const { user, logout, API_URL } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const q = [];
      if (statusFilter) q.push(`status=${statusFilter}`);
      if (priorityFilter) q.push(`priority=${priorityFilter}`);
      if (searchTerm) q.push(`search=${encodeURIComponent(searchTerm)}`);
      
      const queryStr = q.length > 0 ? `?${q.join('&')}` : '';
      const res = await axios.get(`${API_URL}/complaints${queryStr}`);
      setComplaints(res.data);
    } catch (err) {
      console.error('Error loading staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [statusFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStaffData();
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

  // Compute local quick counts for staff's department
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-[-300px] left-[50%] -translate-x-[50%] w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Nav Header */}
      <nav className="glass-panel sticky top-0 z-10 border-b border-slate-800/80 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/20">
            <ShieldCheck className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Campus <span className="text-brand-400">Redressal</span>
            <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">STAFF PANEL</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-end gap-1">
              <Building className="w-3 h-3 text-brand-400" />
              <span>{user?.department} Staff</span>
            </div>
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
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Staff Redressal Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Showing complaints assigned exclusively to your department: <strong className="text-brand-400">{user?.department}</strong>.
            </p>
          </div>
          
          {/* Department badge in header */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center gap-2 max-w-xs">
            <Building className="w-5 h-5 text-brand-400 shrink-0" />
            <div>
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Assigned Queue</div>
              <div className="text-xs font-bold text-slate-200">{user?.department}</div>
            </div>
          </div>
        </div>

        {/* Small Statistics Counters */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-3 rounded-xl text-center">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Assigned Total</div>
            <div className="text-xl font-bold text-white mt-0.5">{complaints.length}</div>
          </div>
          <div className="glass-card p-3 rounded-xl text-center border-l-2 border-l-amber-500/40">
            <div className="text-[9px] text-amber-500 uppercase font-bold tracking-wider">Pending</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{pendingCount}</div>
          </div>
          <div className="glass-card p-3 rounded-xl text-center border-l-2 border-l-blue-500/40">
            <div className="text-[9px] text-blue-500 uppercase font-bold tracking-wider">In Progress</div>
            <div className="text-xl font-bold text-blue-400 mt-0.5">{inProgressCount}</div>
          </div>
          <div className="glass-card p-3 rounded-xl text-center border-l-2 border-l-brand-500/40 hidden md:block">
            <div className="text-[9px] text-brand-500 uppercase font-bold tracking-wider">Resolved</div>
            <div className="text-xl font-bold text-brand-400 mt-0.5">{resolvedCount}</div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="space-y-6">
          {/* Filters panel */}
          <div className="glass-card p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-end border border-slate-850">
            <div className="sm:col-span-1">
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Search Complaints</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search keywords..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-100 focus:outline-none transition-all"
                />
              </div>
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

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-2 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
              <AlertCircle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <h3 className="text-slate-400 font-semibold">No complaints found for your department</h3>
              <p className="text-slate-500 text-xs mt-1">There are no pending, active, or historical complaints matching the current filters.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden border border-slate-850">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-5">Complaint</th>
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
                          <div className="font-bold text-slate-200 truncate">
                            {c.title}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{c.description}</div>
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
      </main>
    </div>
  );
};

export default StaffDashboard;
