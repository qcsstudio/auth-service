const Question = require("./Questionschema");

const normalizeArray = (val) => {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [val];
};

exports.createQuestion = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const companyId = req.user?.companyId;

    const {
      cycleId,
      text,
      options,
      correctOptionId,
      ratingScale,
      hasComment,
      order,
      status,
    } = req.body;

    if (!companyId || !text) {
      return res.status(400).json({
        success: false,
        message: "companyId and text are required",
      });
    }
    const safeOptions = normalizeArray(options).map((opt, index) => {
      if (typeof opt === "string") {
        return {
          id: String(index + 1),
          text: opt,
          isCorrect: false,
        };
      }
      return {
        id: opt?.id || String(index + 1),
        text: opt?.text || "",
        isCorrect: opt?.isCorrect || false,
      };
    });

    if (
      correctOptionId &&
      !safeOptions.some((o) => o.id === correctOptionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "correctOptionId must match an option id",
      });
    }

    const payload = {
      companyId,
      adminId,
      cycleId,
      text,
      options: safeOptions,
      correctOptionId,
      ratingScale,
      hasComment,
      order,
      status,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const question = await Question.create(payload);

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID not found in user",
      });
    }

    const filter = { companyId };
    const questions = await Question.find(filter)
      .sort({  createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
};