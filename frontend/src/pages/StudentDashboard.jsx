import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  LogOut,
  User as UserIcon,
  Search,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  FileUp,
  Paperclip,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout, API_URL } = useAuth();
  const [myComplaints, setMyComplaints] = useState([]);
  const [communityComplaints, setCommunityComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('mine');
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hostel');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachment, setAttachment] = useState(null);
  
  // Advanced features
  const [duplicates, setDuplicates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Community filtering
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState('');

  const filteredCommunityComplaints = communityComplaints.filter(c =>
    communityCategoryFilter === '' || c.category === communityCategoryFilter
  );

  // Load complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const myRes = await axios.get(`${API_URL}/complaints/mine`);
      setMyComplaints(myRes.data);

      const commRes = await axios.get(`${API_URL}/complaints`);
      // Filter out anonymous complaints from other users for privacy, but keep student's own anonymous complaints in myRes
      const community = commRes.data.filter(c => !c.isAnonymous || c.studentId === user.id);
      setCommunityComplaints(community);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Trigger duplicate check when title or category changes
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (title.length > 5 && category) {
        try {
          const res = await axios.get(
            `${API_URL}/complaints/check-duplicate?title=${encodeURIComponent(title)}&category=${category}`
          );
          // Filter out user's own complaints from duplicates
          setDuplicates(res.data.filter(d => d.studentId !== user.id));
        } catch (err) {
          console.error(err);
        }
      } else {
        setDuplicates([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [title, category]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleUpvote = async (id, e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/complaints/${id}/upvote`);
      // Update counts locally
      fetchComplaints();
    } catch (err) {
      console.error('Error upvoting:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      setSubmitError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('isAnonymous', isAnonymous);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      await axios.post(`${API_URL}/complaints`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setIsAnonymous(false);
      setAttachment(null);
      setDuplicates([]);

      setTimeout(() => {
        setSubmitSuccess(false);
        setShowModal(false);
        fetchComplaints();
      }, 1500);

    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Error submitting complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'Resolved':
        return 'bg-brand-500/10 text-brand-400 border border-brand-500/25';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/25';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'text-red-400 font-bold animate-pulse';
      case 'High':
        return 'text-orange-400 font-semibold';
      case 'Medium':
        return 'text-amber-400';
      case 'Low':
        return 'text-slate-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12 relative overflow-hidden">
      {/* Glow overlays */}
      <div className="absolute top-[-300px] left-[50%] -translate-x-[50%] w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="glass-panel sticky top-0 z-10 border-b border-slate-800/80 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/25">
            <FileText className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Campus <span className="text-brand-400">Redressal</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300 font-medium">
            <UserIcon className="w-3.5 h-3.5 text-brand-400" />
            <span>{user?.name} (Student)</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all text-xs"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 mt-8 flex-1">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Student Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              File a complaint, track resolution status, and support other community grievances.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg hover:shadow-brand-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>File New Complaint</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 mb-6 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('mine')}
              className={`py-3 px-4 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
                activeTab === 'mine'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              My Complaints ({myComplaints.length})
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`py-3 px-4 font-semibold text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
                activeTab === 'community'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Community Board ({communityComplaints.length})
            </button>
          </div>

          {activeTab === 'community' && (
            <div className="flex items-center gap-2 pb-2 sm:pb-0">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Filter Category:</span>
              <select
                value={communityCategoryFilter}
                onChange={(e) => setCommunityCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
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
          )}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-2 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* My Complaints Tab */}
            {activeTab === 'mine' && (
              myComplaints.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                  <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-300">No complaints filed yet</h3>
                  <p className="text-slate-500 text-sm mt-1 mb-4">You haven't submitted any complaints or redressal requests yet.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300 transition-all font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>File your first complaint</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myComplaints.map((c) => (
                    <Link
                      to={`/complaints/${c._id}`}
                      key={c._id}
                      className="glass-card p-5 rounded-2xl hover:border-slate-700 transition-all block group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {c.category}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                              {c.status}
                            </span>
                            {c.isAnonymous && (
                              <span className="text-xs bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-full">
                                Anonymous
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors mt-2">
                            {c.title}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {c.description}
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-500">
                        <span>Assigned to: <strong className="text-slate-300 font-medium">{c.department}</strong></span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {c.upvotes?.length || 0}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {c.comments?.length || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* Community Board Tab */}
            {activeTab === 'community' && (
              filteredCommunityComplaints.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
                  <HelpCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-300">No community complaints visible</h3>
                  <p className="text-slate-500 text-sm mt-1">There are no complaints matching the selected category on the Community Board.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredCommunityComplaints.map((c) => {
                    const hasUpvoted = c.upvotes?.includes(user?.id);
                    return (
                      <Link
                        to={`/complaints/${c._id}`}
                        key={c._id}
                        className="glass-card p-5 rounded-2xl hover:border-slate-700 transition-all block group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {c.category}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                                {c.status}
                              </span>
                              <span className="text-xs text-slate-400">
                                Filed by: <strong className="text-slate-300 font-medium">{c.studentName}</strong>
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors mt-2">
                              {c.title}
                            </h3>
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                          {c.description}
                        </p>
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-500">
                          <span>Assigned to: <strong className="text-slate-300 font-medium">{c.department}</strong></span>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => handleUpvote(c._id, e)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-medium ${
                                hasUpvoted
                                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/35 hover:bg-brand-500/20'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-brand-400/20 stroke-brand-400' : ''}`} />
                              <span>{hasUpvoted ? 'Upvoted' : 'Upvote'} ({c.upvotes?.length || 0})</span>
                            </button>
                            <span className="flex items-center gap-1 py-1"><MessageSquare className="w-3.5 h-3.5" /> {c.comments?.length || 0}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* Create Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-2">File New Complaint</h2>
            <p className="text-xs text-slate-400 mb-6">All complaints are logged dynamically. Category mapping assigns departments automatically.</p>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/35 text-red-200 p-3 rounded-lg text-sm mb-5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="bg-brand-500/15 border border-brand-500/30 text-brand-300 p-4 rounded-lg text-sm mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0 text-brand-400" />
                <span>Complaint submitted successfully! Updating list...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category selector */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Complaint Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-all text-sm"
                >
                  <option value="Hostel">Hostel (Warden Desk)</option>
                  <option value="Academic">Academic (Academic Office)</option>
                  <option value="Infrastructure">Infrastructure (Maintenance)</option>
                  <option value="Ragging/Harassment">Ragging / Harassment (Anti-Ragging Committee)</option>
                  <option value="Canteen">Canteen (Food Management)</option>
                  <option value="IT/Library">IT / Library (IT Desk)</option>
                  <option value="Other">Other (General Admin)</option>
                </select>
                
                {/* Ragging Category Flag Indicator */}
                {category === 'Ragging/Harassment' && (
                  <div className="mt-2 bg-red-500/10 border border-red-500/20 text-red-300 p-2.5 rounded-lg text-xs flex gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                    <span><strong>Urgent Auto-priority Action:</strong> Complaints in this sensitive category are automatically flagged <strong>Urgent</strong> and sent directly to the Anti-Ragging panel.</span>
                  </div>
                )}
              </div>

              {/* Title input */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize the issue (e.g. Wi-Fi broken in Library)"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-all text-sm"
                  required
                />

                {/* Duplicate matches suggestion list */}
                {duplicates.length > 0 && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
                    <div className="flex gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                      <span>Similar Complaints Found ({duplicates.length})</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2.5">
                      To help solve issues faster and reduce duplication, please check if one of these existing complaints matches yours. You can view and upvote them instead of submitting:
                    </p>
                    <ul className="space-y-1.5">
                      {duplicates.map(d => (
                        <li key={d._id} className="text-xs">
                          <Link to={`/complaints/${d._id}`} className="text-brand-400 hover:underline font-semibold block truncate">
                            • {d.title} (Upvotes: {d.upvotes?.length || 0})
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Detailed Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details of the problem including times, locations, and any specific details."
                  className="w-full h-32 bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2.5 px-4 text-slate-100 placeholder-slate-600 focus:outline-none transition-all text-sm"
                  required
                />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Attach Evidence (Optional)
                </label>
                <div className="relative border border-dashed border-slate-800 hover:border-slate-700 rounded-xl py-4 px-4 flex flex-col items-center justify-center bg-slate-900/20 transition-all">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*,application/pdf"
                  />
                  <div className="flex flex-col items-center gap-1.5 text-center text-slate-400">
                    {attachment ? (
                      <>
                        <Paperclip className="w-6 h-6 text-brand-400 animate-bounce" />
                        <span className="text-xs text-slate-200 font-semibold truncate max-w-xs">{attachment.name}</span>
                        <span className="text-[10px] text-slate-500">{(attachment.size / (1024 * 1024)).toFixed(2)} MB · Click/drag to change</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6 text-slate-600" />
                        <span className="text-xs font-medium">Click or drag image / PDF evidence</span>
                        <span className="text-[10px] text-slate-500">Max size: 5MB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Anonymity toggle */}
              <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
                <div>
                  <label className="text-sm font-semibold text-slate-200 block">
                    Submit Anonymously
                  </label>
                  <span className="text-[10px] text-slate-500 block">Identity will be shielded from administrators and other students.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500 peer-checked:after:bg-slate-950 peer-checked:after:border-transparent"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-850 bg-slate-900 text-slate-300 font-semibold hover:bg-slate-800 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
