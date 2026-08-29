import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  Calendar,
  User as UserIcon,
  Tag,
  Building,
  Flag,
  FileText,
  Clock,
  MessageSquare,
  Send,
  ThumbsUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  CornerDownRight,
  ShieldCheck,
  Download,
  SlidersHorizontal,
  FileCheck2
} from 'lucide-react';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, API_URL } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Admin status update state
  const [statusInput, setStatusInput] = useState('');
  const [remarkInput, setRemarkInput] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);

  // Student feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Student Reopen state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/complaints/${id}`);
      setComplaint(res.data);
      setStatusInput(res.data.status);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching complaint details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      await axios.post(`${API_URL}/complaints/${id}/comments`, { text: commentText });
      setCommentText('');
      fetchComplaint(); // Reload data
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error adding comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusInput) return;

    setStatusSubmitting(true);
    try {
      await axios.patch(`${API_URL}/complaints/${id}/status`, {
        status: statusInput,
        remark: remarkInput,
      });
      setRemarkInput('');
      setStatusSuccess(true);
      setTimeout(() => {
        setStatusSuccess(false);
        fetchComplaint();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      await axios.post(`${API_URL}/complaints/${id}/feedback`, {
        rating,
        comment: feedbackComment,
      });
      setFeedbackComment('');
      fetchComplaint();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error submitting feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    setReopenSubmitting(true);
    try {
      await axios.post(`${API_URL}/complaints/${id}/reopen`, {
        reason: reopenReason,
      });
      setShowReopenModal(false);
      setReopenReason('');
      fetchComplaint();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error reopening complaint');
    } finally {
      setReopenSubmitting(false);
    }
  };

  const handleUpvote = async () => {
    try {
      await axios.post(`${API_URL}/complaints/${id}/upvote`);
      fetchComplaint();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-amber-400" />;
      case 'In Progress':
        return <SlidersHorizontal className="w-5 h-5 text-blue-400" />;
      case 'Resolved':
        return <CheckCircle className="w-5 h-5 text-brand-400" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Resolved':
        return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="w-10 h-10 border-2 border-slate-800 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-6 rounded-2xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Error</h3>
          <p className="text-sm text-slate-400 mt-2">{error || 'Complaint not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-5 inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
  const isAuthor = user?.id === (complaint.studentId ? complaint.studentId.toString() : null) || (complaint.studentId === null && !isAdminOrStaff); // Handling edge-case anonymous authors locally
  const hasUpvoted = complaint.upvotes?.includes(user?.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute top-[-300px] left-[50%] -translate-x-[50%] w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Nav Header */}
      <nav className="glass-panel sticky top-0 z-10 border-b border-slate-800/80 px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate(isAdminOrStaff ? '/admin' : '/student')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <span className="font-semibold text-xs text-slate-500 uppercase tracking-widest">
          Complaint Reference: <span className="text-slate-300 font-bold font-mono">#{complaint._id.slice(-6).toUpperCase()}</span>
        </span>
      </nav>

      {/* Main container */}
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Details + Comments (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Details Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 relative">
            
            {/* Category and Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                <Tag className="w-3 h-3 text-brand-400" />
                {complaint.category}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColorClass(complaint.status)}`}>
                {complaint.status}
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-850 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                Priority: <strong className="text-slate-200">{complaint.priority}</strong>
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4 leading-snug">
              {complaint.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 border-b border-slate-800 pb-4 mb-5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Filed by: <strong className={complaint.isAnonymous ? 'text-amber-500 font-semibold' : 'text-slate-300 font-semibold'}>{complaint.studentName}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Filed Date: <strong className="text-slate-300 font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Routing Queue: <strong className="text-slate-300 font-medium">{complaint.department}</strong></span>
              </span>
            </div>

            {/* Description text */}
            <div className="space-y-4">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider font-bold">Complaint Details</h3>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-900/30 p-4 rounded-xl border border-slate-900">
                {complaint.description}
              </p>
            </div>

            {/* Attachment evidence */}
            {complaint.attachmentUrl && (
              <div className="mt-6 border-t border-slate-900 pt-5 space-y-3">
                <h3 className="text-xs text-slate-500 uppercase tracking-wider font-bold">Evidence Attachment</h3>
                <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl max-w-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-6 h-6 text-brand-400 shrink-0" />
                    <span className="text-xs text-slate-300 font-semibold truncate">
                      {complaint.attachmentUrl.split('/').pop()}
                    </span>
                  </div>
                  
                  {/* If image, let it display in high resolution directly or download */}
                  <a
                    href={complaint.attachmentUrl.startsWith('/') ? `http://localhost:5000${complaint.attachmentUrl}` : complaint.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-slate-950 font-bold bg-brand-400 hover:bg-brand-500 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Download className="w-3 h-3 stroke-[2.5]" />
                    <span>View File</span>
                  </a>
                </div>

                {/* Inline image preview if attachment is image */}
                {/\.(jpg|jpeg|png|gif)$/i.test(complaint.attachmentUrl) && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-850 max-w-sm max-h-60 bg-slate-900/40">
                    <img
                      src={complaint.attachmentUrl.startsWith('/') ? `http://localhost:5000${complaint.attachmentUrl}` : complaint.attachmentUrl}
                      alt="Complaint attachment evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Support/Upvote button for student board */}
            {!isAdminOrStaff && !isAuthor && (
              <div className="mt-6 border-t border-slate-900 pt-4 flex justify-between items-center">
                <p className="text-[10px] text-slate-500">Is this issue affecting you too? Show your support to raise priority.</p>
                <button
                  onClick={handleUpvote}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${
                    hasUpvoted
                      ? 'bg-brand-500/10 text-brand-400 border-brand-500/35'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{hasUpvoted ? 'Upvoted' : 'Upvote Complaint'} ({complaint.upvotes?.length || 0})</span>
                </button>
              </div>
            )}
          </div>

          {/* Comments Discussion Section */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-brand-400" />
              <span>Discussion & Follow-ups</span>
            </h2>

            {/* Comment List */}
            <div className="space-y-4 mb-6">
              {complaint.comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-900/10 border border-slate-900 rounded-xl">
                  No discussion comments yet. Add a comment below to follow up.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {complaint.comments.map((comment) => (
                    <div
                      key={comment._id}
                      className={`p-3.5 rounded-xl border text-xs max-w-[90%] leading-relaxed ${
                        comment.authorId === user?.id
                          ? 'bg-slate-900/70 border-slate-800 ml-auto'
                          : 'bg-slate-900/30 border-slate-900 mr-auto'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-4 text-[10px] text-slate-500 mb-1.5">
                        <span className="font-semibold text-slate-400">{comment.authorName} ({comment.authorRole})</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a response or follow-up note..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-brand-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-650 focus:outline-none transition-all"
                disabled={commentSubmitting}
              />
              <button
                type="submit"
                disabled={commentSubmitting || !commentText.trim()}
                className="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold p-2.5 rounded-xl transition-all disabled:opacity-50 shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Life-cycle Timeline & Actions (1/3 width) */}
        <div className="space-y-6">
          
          {/* Status Lifecycle Timeline */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Status Timeline</span>
            </h2>

            <div className="relative border-l border-slate-800 ml-2.5 pl-5 space-y-5 py-2">
              {complaint.statusHistory.map((history, idx) => (
                <div key={history._id} className="relative text-xs">
                  {/* Timeline dot icon */}
                  <span className="absolute -left-[30px] top-0 bg-slate-950 p-0.5 rounded-full border border-slate-800">
                    {getStatusIcon(history.status)}
                  </span>
                  
                  <div>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{history.status}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        by {history.changedByName}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-600 block mt-0.5">
                      {new Date(history.changedAt).toLocaleString()}
                    </span>
                    <p className="text-slate-400 mt-1.5 italic bg-slate-900/50 p-2 rounded border border-slate-900/60 leading-normal">
                      "{history.remark || 'No remark provided.'}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS: Admin Management Controls */}
          {isAdminOrStaff && (
            <div className="glass-panel rounded-2xl p-6 border border-brand-500/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-350 mb-4 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-brand-400" />
                <span>Admin Resolution Panel</span>
              </h2>

              {statusSuccess && (
                <div className="bg-brand-500/10 border border-brand-500/25 text-brand-400 p-3 rounded-lg text-xs mb-4 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Resolution status updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">Change Status</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">Resolution Remarks</label>
                  <textarea
                    value={remarkInput}
                    onChange={(e) => setRemarkInput(e.target.value)}
                    placeholder="Enter resolution actions or status changes reason..."
                    className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none placeholder-slate-650"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={statusSubmitting}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold py-2 px-4 rounded-xl transition-all shadow-lg text-xs"
                >
                  {statusSubmitting ? 'Updating...' : 'Update Status & Remark'}
                </button>
              </form>
            </div>
          )}

          {/* ACTIONS: Student Post-resolution Feedback or Reopen */}
          {isAuthor && !isAdminOrStaff && (
            <div className="space-y-6">
              
              {/* Feedback Form (Resolution rating) */}
              {complaint.status === 'Resolved' && (
                <div className="glass-panel rounded-2xl p-6 border border-emerald-500/10">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-450 mb-3 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-brand-400" />
                    <span>Resolution Feedback</span>
                  </h2>

                  {complaint.feedback ? (
                    // Feedback details if already submitted
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-semibold">Your Rating:</span>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < complaint.feedback.rating ? 'fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-300 italic">"{complaint.feedback.comment || 'No comment left.'}"</p>
                      <span className="text-[9px] text-slate-500 block mt-2">Submitted feedback</span>
                    </div>
                  ) : (
                    // Form to submit feedback
                    <form onSubmit={handleFeedbackSubmit} className="space-y-3.5">
                      <p className="text-[10px] text-slate-400">Please rate the campus redressal resolution. Feedback will be visible to administrator panels.</p>
                      
                      {/* Rating selection (Stars) */}
                      <div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="text-amber-400 focus:outline-none"
                            >
                              <Star className={`w-6 h-6 hover:scale-110 transition-transform ${star <= rating ? 'fill-amber-400' : 'text-slate-650'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Leave an optional review comment..."
                        className="w-full h-16 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none"
                      />

                      <button
                        type="submit"
                        disabled={feedbackSubmitting}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold py-2 rounded-xl transition-all text-xs"
                      >
                        {feedbackSubmitting ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Reopen Action button */}
              {(complaint.status === 'Resolved' || complaint.status === 'Rejected') && (
                <div className="glass-panel rounded-2xl p-5 border border-red-500/10 text-center">
                  <p className="text-xs text-slate-400 mb-3">Still unsatisfied with the redressal or does the issue persist?</p>
                  <button
                    onClick={() => setShowReopenModal(true)} // Open Reopen Modal
                    className="w-full bg-slate-900 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-350 border border-slate-800 font-bold py-2 rounded-xl transition-all text-xs"
                  >
                    Reopen Complaint
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* REOPEN MODAL */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-800">
            <h2 className="text-lg font-bold text-white mb-2">Reopen Complaint</h2>
            <p className="text-xs text-slate-400 mb-4">Please state your reason for reopening. This complaint will go back to the Pending status queue.</p>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Describe why the solution is incomplete..."
                className="w-full h-24 bg-slate-900 border border-slate-800 focus:border-brand-500 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                required
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  disabled={reopenSubmitting}
                  className="px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 text-xs rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopenSubmitting || !reopenReason.trim()}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs px-5 py-2 rounded-xl font-bold transition-all"
                >
                  {reopenSubmitting ? 'Reopening...' : 'Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;
//
