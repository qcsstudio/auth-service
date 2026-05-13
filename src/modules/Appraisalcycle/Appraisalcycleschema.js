const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewerWeightSchema = new Schema(
  {
    manager:      { type: Number, default: 40, min: 0, max: 100 },
    peers:        { type: Number, default: 20, min: 0, max: 100 },
    subordinates: { type: Number, default: 20, min: 0, max: 100 },
    self:         { type: Number, default: 10, min: 0, max: 100 },
    others:       { type: Number, default: 10, min: 0, max: 100 },
  },
  { _id: false }
);

const ReviewerSelectionSchema = new Schema(
  {
    hrCanNominate:           { type: Boolean, default: true },
    employeeCanSuggest:      { type: Boolean, default: true },
    managerApproves:         { type: Boolean, default: true },
    autoAllocateHierarchy:   { type: Boolean, default: true },
    keepAnonymous:           { type: Boolean, default: true },
    minReviewers:            { type: Number,  default: 3, min: 1 },
    maxReviewers:            { type: Number,  default: 8, min: 1 },
    customerRatingQuestions: { type: Number,  default: 3, min: 0 },
  },
  { _id: false }
);

const FormQuestionSchema = new Schema(
  {
    questionText: { type: String, },
    ratingScale:  { type: Number, default: 5 },
    hasComment:   { type: Boolean, default: true },
  },
  { _id: false }
);

const FormSectionSchema = new Schema(
  {
    title:     { type: String, },
    enabled:   { type: Boolean, default: true },
    questions: { type: [FormQuestionSchema], default: [] },
    order:     { type: Number, default: 0 },
  },
  { _id: true }
);

const OverallAssessmentSchema = new Schema(
  {
    include: { type: Boolean, default: true },
    questions: {
      type: [String],
    //   default: [
    //     "What are the employee's main strengths?",
    //     "What areas require improvement?",
    //     "What training or development is recommended?",
    //     "Is this employee ready for higher responsibilities? (Yes/No)",
    //     "Additional comments",
    //   ],
    },
    autoGenerateFinalSummary: { type: Boolean, default: true },
  },
  { _id: false }
);

const WorkflowSchema = new Schema(
  {
    requireHrApproval:       { type: Boolean, default: true },
    requireDeptHeadApproval: { type: Boolean, default: false },
    autoSaveResponses:       { type: Boolean, default: true },
    auditTrail:              { type: Boolean, default: true },
    roleBasedAccessControl:  { type: Boolean, default: true },
    exportToExcel:           { type: Boolean, default: true },
    exportToPdf:             { type: Boolean, default: true },
    mobileFriendly:          { type: Boolean, default: true },
  },
  { _id: false }
);

const NotificationSchema = new Schema(
  {
    email:              { type: Boolean, default: true },
    inApp:              { type: Boolean, default: true },
    sms:                { type: Boolean, default: false },
    reminderDaysBefore: { type: Number,  default: 3, min: 0 },
  },
  { _id: false }
);

const AppraisalCycleSchema = new Schema(
  {
    adminId:   { type: Schema.Types.ObjectId, ref: "User",   },
    companyId: { type: Schema.Types.ObjectId, ref: "Company",},

    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    cycleType: {
      type: String,
    //   enum: [
    //     "Annual Appraisal",
    //     "Mid-Year Review",
    //     "Probation Review",
    //     "Promotion Review",
    //     "Leadership Review",
    //     "Special Review",
    //   ],
      default: "Annual Appraisal",
    },
    startDate:             { type: Date, },
    endDate:               { type: Date, },
    reviewDeadline:        { type: Date, },
    applicableDepartments: { type: [String], default: [] },
    applicableJobGrades:   { type: [String], default: [] },

    reviewerWeights:   { type: ReviewerWeightSchema,    default: () => ({}) },
    reviewerSelection: { type: ReviewerSelectionSchema, default: () => ({}) },

    selectedCompetencies: {
      type: [String],
    //   default: ["Leadership", "Teamwork", "Communication", "Accountability", "Problem-solving"],
    //   enum: [
    //     "Leadership", "Teamwork", "Communication", "Accountability",
    //     "Problem-solving", "Customer focus", "Innovation", "Discipline",
    //     "Technical competency",
    //   ],
    },

    formSections:      { type: [FormSectionSchema],    default: [] },
    overallAssessment: { type: OverallAssessmentSchema, default: () => ({}) },

    workflow:      { type: WorkflowSchema,     default: () => ({}) },
    notifications: { type: NotificationSchema, default: () => ({}) },

    status: {
      type: String,
      enum: ["draft", "active", "closed", "archived"],
      default: "draft",
    },
    launchedAt: { type: Date, default: null },
    closedAt:   { type: Date, default: null },
    createdBy:  { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy:  { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "appraisalcycles",
  }
);


const AppraisalCycle = mongoose.model("AppraisalCycle", AppraisalCycleSchema);
module.exports = AppraisalCycle;