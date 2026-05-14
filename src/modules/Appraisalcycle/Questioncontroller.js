const Question = require("./Questionschema");
// ================= NORMALIZE ARRAY =================

const normalizeArray = (val) => {

  if (val === undefined || val === null) {
    return [];
  }

  if (Array.isArray(val)) {
    return val;
  }

  if (typeof val === "string") {
    return val
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [val];
};

// ================= CREATE QUESTIONS =================

exports.createQuestions = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const companyId = req.user?.companyId;

    const { cycleId, questions } = req.body;

    // ================= VALIDATION =================
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company not found",
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required",
      });
    }

    // ================= PREPARE =================
    const preparedQuestions = questions.map((question, qIndex) => {
      const {
        text,
        options,
        ratingScale,
        hasComment,
        order,
        status,
      } = question;

      if (!text?.trim()) {
        throw new Error(`Question text missing at question ${qIndex + 1}`);
      }

      const normalizedOptions = normalizeArray(options);

      if (normalizedOptions.length < 2) {
        throw new Error(`Minimum 2 options required at question ${qIndex + 1}`);
      }

      const safeOptions = normalizedOptions.map((option, index) => {
        if (typeof option === "string") {
          return {
            id: String(index + 1),
            text: option.trim(),
            isCorrect: false,
          };
        }

        return {
          id: option.id || String(index + 1),
          text: option.text?.trim() || "",
          isCorrect: option.isCorrect === true,
        };
      });

      // check at least one correct answer
      const hasCorrect = safeOptions.some((opt) => opt.isCorrect === true);

      if (!hasCorrect) {
        throw new Error(`No correct option marked at question ${qIndex + 1}`);
      }

      const hasEmpty = safeOptions.some((opt) => !opt.text);

      if (hasEmpty) {
        throw new Error(`Empty option found at question ${qIndex + 1}`);
      }

      return {
        companyId,
        adminId,
        cycleId: cycleId || null,
        text: text.trim(),
        options: safeOptions,
        ratingScale: ratingScale ?? 5,
        hasComment: typeof hasComment === "boolean" ? hasComment : true,
        order: order ?? qIndex + 1,
        status: status || "active",
      };
    });

    const createdQuestions = await Question.insertMany(preparedQuestions);

    return res.status(201).json({
      success: true,
      message: "Questions created successfully",
      count: createdQuestions.length,
      data: createdQuestions,
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