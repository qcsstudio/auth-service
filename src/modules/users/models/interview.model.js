const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
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
  scheduledDate: {
    type: Date,
    required: true
  },
  interviewerName: String,
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'pending'],
    default: 'scheduled'
  },
//   feedback: String,
//   rating: {
//     type: Number,
//     min: 1,
//     max: 5
//   },
//   result: {
//     type: String,
//     enum: ['pass', 'fail', 'hold']
//   },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;