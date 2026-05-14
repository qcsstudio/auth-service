const mongoose = require("mongoose");
const { Schema } = mongoose;

const OptionSchema = new Schema(
  {
    id: {
      type: String,
    },

    text: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cycleId: {
      type: Schema.Types.ObjectId,
      ref: "AppraisalCycle",
      default: null,
    },

    text: {
      type: String,
      trim: true,
    },

    options: {
      type: [OptionSchema],
      default: [],
    },

    correctOptionId: {
      type: String,
    },

    ratingScale: {
      type: Number,
      default: 5,
    },

    hasComment: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "questions",
  }
);

const Question = mongoose.model("Question", QuestionSchema);

module.exports = Question;