import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  resumeData: {
    type: Object,
    required: true
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  shareExpiry: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Resume = mongoose.model('Resume', ResumeSchema);

export default Resume;