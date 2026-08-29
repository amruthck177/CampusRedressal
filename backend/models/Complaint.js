const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  changedByName: {
    type: String,
    required: true,
  },
  remark: {
    type: String,
    default: '',
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

const CommentSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorRole: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FeedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    default: '',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ComplaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null if anonymous
    },
    studentName: {
      type: String,
      default: 'Anonymous',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Hostel',
        'Academic',
        'Infrastructure',
        'Ragging/Harassment',
        'Canteen',
        'IT/Library',
        'Other',
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    department: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    statusHistory: [StatusHistorySchema],
    comments: [CommentSchema],
    feedback: {
      type: FeedbackSchema,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', ComplaintSchema);
