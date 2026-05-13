const mongoose = require("mongoose");
const { Schema } = mongoose;

const OptionSchema = new Schema(
  {
    id:        { type: String, },
    text:      { type: String, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    companyId:       { type: Schema.Types.ObjectId, ref: "Company", },
    adminId:         { type: Schema.Types.ObjectId, ref: "User",    },
    cycleId:         { type: Schema.Types.ObjectId, ref: "AppraisalCycle", default: null },
    text:            { type: String,  trim: true },
    options:         { type: [OptionSchema], default: [] },
    correctOptionId: { type: String, default: null },
    ratingScale:     { type: Number, default: 5 },
    hasComment:      { type: Boolean, default: true },
    order:           { type: Number, default: 0 },
    status:          { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    timestamps: true,
    collection: "questions",
  }
);

// QuestionSchema.index({ companyId: 1, cycleId: 1 });
// QuestionSchema.index({ adminId: 1, companyId: 1 });

const Question = mongoose.model("Question", QuestionSchema);
module.exports = Question;