const mongoose = require("mongoose");


const applicationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  position: {
    type: String,
    required: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'shortlisted', 'rejected'],
    default: 'new'
  },
  resume: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;