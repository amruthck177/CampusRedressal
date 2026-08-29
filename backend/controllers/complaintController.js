const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');

// Helper to map category to department
const mapCategoryToDepartment = (category) => {
  const mapping = {
    'Hostel': 'Hostel Warden',
    'Academic': 'Academic Office',
    'Infrastructure': 'Maintenance Desk',
    'Ragging/Harassment': 'Anti-Ragging Committee',
    'Canteen': 'Canteen Management',
    'IT/Library': 'IT & Library Administration',
    'Other': 'General Administration',
  };
  return mapping[category] || 'General Administration';
};

// Create complaint (Student)
exports.createComplaint = async (req, res) => {
  try {
    const { title, category, description, isAnonymous } = req.body;
    let attachmentUrl = req.body.attachmentUrl || null;

    // Check if file was uploaded via multer and stored locally
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    if (!title || !category || !description) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Auto routing & priority mapping
    const department = mapCategoryToDepartment(category);
    let priority = 'Medium';
    if (category === 'Ragging/Harassment') {
      priority = 'Urgent';
    }

    const complaint = new Complaint({
      studentId: req.user.id,
      studentName: isAnonymous ? 'Anonymous' : req.user.name,
      title,
      category,
      description,
      attachmentUrl,
      isAnonymous: !!isAnonymous,
      priority,
      department,
    });

    // Save history
    complaint.statusHistory.push({
      status: 'Pending',
      changedBy: req.user.id,
      changedByName: req.user.name,
      remark: 'Complaint submitted successfully.',
    });

    await complaint.save();

    // Create Audit Log
    const audit = new AuditLog({
      complaintId: complaint._id,
      action: 'Complaint Created',
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Created complaint "${title}" in category "${category}". Priority automatically set to ${priority}.`,
    });
    await audit.save();

    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student's own complaints
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all complaints with filters/sorting/search (Admin)
exports.getComplaints = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    // Staff can only see complaints assigned to their department
    if (req.user && req.user.role === 'staff') {
      query.department = req.user.department;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort: Urgent priorities first, then newest
    let complaints = await Complaint.find(query).sort({
      priority: -1, // Note: standard MongoDB sort won't naturally put 'Urgent' first unless mapped, we'll sort in JS or use structured weights
      createdAt: -1
    });

    // Custom sort to make sure 'Urgent' is strictly at the top, then 'High', 'Medium', 'Low'
    const priorityWeights = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    complaints.sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Scrub student identity from anonymous complaints if the user is not the author
    const scrubbedComplaints = complaints.map(c => {
      const obj = c.toObject();
      if (obj.isAnonymous) {
        obj.studentId = null;
        obj.studentName = 'Anonymous';
      }
      return obj;
    });

    res.json(scrubbedComplaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single complaint details
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Staff can only view complaints in their own department
    if (req.user && req.user.role === 'staff' && complaint.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: You are not authorized to view complaints outside your department' });
    }

    const obj = complaint.toObject();
    
    // Check if anonymous and requester is not the original student
    const isAuthor = req.user.id === (complaint.studentId ? complaint.studentId.toString() : null);
    if (obj.isAnonymous && !isAuthor && req.user.role === 'student') {
      obj.studentId = null;
      obj.studentName = 'Anonymous';
    } else if (obj.isAnonymous && req.user.role !== 'student') {
      // For Admin/Staff, still hide student details to preserve true anonymity on dashboard/view
      obj.studentId = null;
      obj.studentName = 'Anonymous (Identity Shielded)';
    }

    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update status (Admin/Staff only)
exports.updateStatus = async (req, res) => {
  try {
    const { status, remark } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Staff can only update status of complaints in their own department
    if (req.user && req.user.role === 'staff' && complaint.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: You can only update complaints within your department' });
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    if (remark) {
      complaint.remarks = remark;
    }

    // Add to history
    complaint.statusHistory.push({
      status,
      changedBy: req.user.id,
      changedByName: req.user.name,
      remark: remark || `Status updated from ${oldStatus} to ${status}`,
    });

    await complaint.save();

    // Create Audit Log
    const audit = new AuditLog({
      complaintId: complaint._id,
      action: 'Status Change',
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Updated status of complaint "${complaint.title}" from "${oldStatus}" to "${status}". Remark: "${remark || 'None'}".`,
    });
    await audit.save();

    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Enforce comment permissions: only complaint author, admins, or staff (matching department) can comment
    const isAuthor = req.user.id === (complaint.studentId ? complaint.studentId.toString() : null);
    const isAdmin = req.user.role === 'admin';
    const isStaffOfDept = req.user.role === 'staff' && complaint.department === req.user.department;

    if (!isAuthor && !isAdmin && !isStaffOfDept) {
      return res.status(403).json({ message: 'You are not authorized to comment on this complaint' });
    }

    const commentAuthorName = (complaint.isAnonymous && isAuthor) ? 'Anonymous (Student)' : req.user.name;

    complaint.comments.push({
      authorId: req.user.id,
      authorName: commentAuthorName,
      authorRole: req.user.role,
      text,
    });

    await complaint.save();

    // Create Audit Log
    const audit = new AuditLog({
      complaintId: complaint._id,
      action: 'Comment Added',
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Added comment to complaint "${complaint.title}".`,
    });
    await audit.save();

    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upvote / +1 (Student only)
exports.upvoteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user already upvoted
    const index = complaint.upvotes.indexOf(req.user.id);
    if (index !== -1) {
      // Remove upvote (toggle)
      complaint.upvotes.splice(index, 1);
      await complaint.save();
      return res.json({ message: 'Upvote removed', upvotesCount: complaint.upvotes.length, upvoted: false });
    }

    complaint.upvotes.push(req.user.id);
    await complaint.save();

    // Create Audit Log
    const audit = new AuditLog({
      complaintId: complaint._id,
      action: 'Upvote Toggled',
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Upvoted complaint "${complaint.title}".`,
    });
    await audit.save();

    res.json({ message: 'Upvoted successfully', upvotesCount: complaint.upvotes.length, upvoted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Submit feedback (Student author only, once Resolved)
exports.submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating) {
      return res.status(400).json({ message: 'Rating (1-5) is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Author verification
    const isAuthor = req.user.id === (complaint.studentId ? complaint.studentId.toString() : null);
    if (!isAuthor) {
      return res.status(403).json({ message: 'Only the creator of the complaint can submit feedback' });
    }

    if (complaint.status !== 'Resolved') {
      return res.status(400).json({ message: 'Feedback can only be submitted for Resolved complaints' });
    }

    complaint.feedback = {
      rating,
      comment: comment || '',
    };

    await complaint.save();

    // Create Audit Log
    const audit = new AuditLog({
      complaintId: complaint._id,
      action: 'Feedback Submitted',
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Submitted rating of ${rating}/5 feedback on complaint "${complaint.title}".`,
    });
    await audit.save();

    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reopen complaint (Student author only, resolved/rejected)
exports.reopenComplaint = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Please provide a reason for reopening' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Author verification
    const isAuthor = req.user.id === (complaint.studentId ? complaint.studentId.toString() : null);
    if (!isAuthor) {
      return res.status(403).json({ message: 'Only the creator can reopen the complaint' });
    }

    const oldStatus = complaint.status;
    if (oldStatus !== 'Resolved' && oldStatus !== 'Rejected') {
      return res.status(400).json({ message: 'Only Resolved or Rejected complaints can be reopened' });
    }

    complaint.status = 'Pending';
    complaint.remarks = ''; // Clear remarks
    complaint.feedback = null; // Clear feedback if reopened

    complaint.statusHistory.push({
      status: 'Pending',
      changedBy: req.user.id,
      changedByName: req.user.name,
      remark: `Complaint Reopened: ${reason}`,
    });

    await complaint.save();

    // Create Audit Log
    const audit = new AuditLog({
      complaintId: complaint._id,
      action: 'Complaint Reopened',
      performedBy: req.user.id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      details: `Reopened complaint "${complaint.title}" with reason: "${reason}".`,
    });
    await audit.save();

    res.json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Duplicate detection endpoint
exports.checkDuplicate = async (req, res) => {
  try {
    const { title, category } = req.query;
    if (!title || !category) {
      return res.json([]);
    }

    // Find other complaints in the same category that are not Resolved/Rejected
    const candidates = await Complaint.find({
      category,
      status: { $in: ['Pending', 'In Progress'] },
    });

    // Simple keyword matching helper
    const getWords = (str) => str.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2);
    const titleWords = getWords(title);

    const matches = candidates.filter(c => {
      const candidateWords = getWords(c.title);
      // Check if any word matches
      const commonWords = titleWords.filter(w => candidateWords.includes(w));
      return commonWords.length >= 2 || (titleWords.length === 1 && commonWords.length === 1);
    });

    res.json(matches.slice(0, 5)); // Return top 5 matches
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Basic Analytics Endpoint
exports.getAnalytics = async (req, res) => {
  try {
    // Scope filter: staff only sees their own department's data
    const deptFilter = (req.user.role === 'staff' && req.user.department)
      ? { department: req.user.department }
      : {};

    // Total counts
    const totalCount = await Complaint.countDocuments(deptFilter);
    const pendingCount = await Complaint.countDocuments({ ...deptFilter, status: 'Pending' });
    const inProgressCount = await Complaint.countDocuments({ ...deptFilter, status: 'In Progress' });
    const resolvedCount = await Complaint.countDocuments({ ...deptFilter, status: 'Resolved' });
    const rejectedCount = await Complaint.countDocuments({ ...deptFilter, status: 'Rejected' });

    // Category breakdown
    const categoryBreakdown = await Complaint.aggregate([
      { $match: deptFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Average resolution time
    const resolvedComplaints = await Complaint.find({ ...deptFilter, status: 'Resolved' });
    let totalResolutionTimeMs = 0;
    let resolvedCountWithHistory = 0;

    resolvedComplaints.forEach(c => {
      const resolveEvent = c.statusHistory.find(h => h.status === 'Resolved');
      if (resolveEvent) {
        const diff = new Date(resolveEvent.changedAt) - new Date(c.createdAt);
        totalResolutionTimeMs += diff;
        resolvedCountWithHistory++;
      }
    });

    const averageResolutionTimeHours = resolvedCountWithHistory > 0
      ? (totalResolutionTimeMs / (1000 * 60 * 60 * resolvedCountWithHistory)).toFixed(1)
      : 'N/A';

    // Audit logs (limit to 50 latest)
    const auditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);

    res.json({
      statusCounts: {
        total: totalCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
      },
      categoryBreakdown: categoryBreakdown.map(cb => ({ category: cb._id, count: cb.count })),
      averageResolutionTimeHours,
      auditLogs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
