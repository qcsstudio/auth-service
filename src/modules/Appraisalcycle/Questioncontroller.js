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

    // ================= USER DATA =================

    const adminId = req.user?._id;

    const companyId = req.user?.companyId;

    // ================= BODY DATA =================

    const {
      cycleId,
      questions,
    } = req.body;

    // ================= VALIDATION =================

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company not found",
      });
    }

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "questions array is required",
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    // ================= PREPARE QUESTIONS =================

    const preparedQuestions = questions.map((question, qIndex) => {

      // ================= QUESTION DESTRUCTURE =================

      const {
        text,
        options,
        correctOptionId,
        ratingScale,
        hasComment,
        order,
        status,
      } = question;

      // ================= QUESTION VALIDATION =================

      if (!text || !text.trim()) {
        throw new Error(
          `Question text missing at question ${qIndex + 1}`
        );
      }

      // ================= NORMALIZE OPTIONS =================

      const normalizedOptions = normalizeArray(options);

      if (normalizedOptions.length < 2) {
        throw new Error(
          `Minimum 2 options required at question ${qIndex + 1}`
        );
      }

      // ================= PREPARE OPTIONS =================

      const safeOptions = normalizedOptions.map(
        (option, optionIndex) => {

          // ===== STRING OPTION =====

          if (typeof option === "string") {
            return {
              id: String(optionIndex + 1),
              text: option.trim(),
            };
          }

          // ===== OBJECT OPTION =====

          const {
            id,
            text,
          } = option;

          return {
            id: id || String(optionIndex + 1),
            text: text?.trim() || "",
          };
        }
      );

      // ================= EMPTY OPTION CHECK =================

      const hasEmptyOption = safeOptions.some(
        (option) => !option.text
      );

      if (hasEmptyOption) {
        throw new Error(
          `Empty option found at question ${qIndex + 1}`
        );
      }

      // ================= CORRECT OPTION VALIDATION =================

      const validCorrectOption = safeOptions.some(
        (option) => option.id === correctOptionId
      );

      if (!validCorrectOption) {
        throw new Error(
          `Invalid correctOptionId at question ${qIndex + 1}`
        );
      }

      // ================= FINAL QUESTION OBJECT =================

      return {

        companyId,

        adminId,

        cycleId: cycleId || null,

        text: text.trim(),

        options: safeOptions,

        correctOptionId,

        ratingScale: ratingScale || 5,

        hasComment:
          typeof hasComment === "boolean"
            ? hasComment
            : true,

        order: order || qIndex + 1,

        status: status || "active",
      };
    });

    // ================= INSERT QUESTIONS =================

    const createdQuestions = await Question.insertMany(
      preparedQuestions
    );

    // ================= SUCCESS RESPONSE =================

    return res.status(201).json({
      success: true,
      message: "Questions created successfully",
      count: createdQuestions.length,
      data: createdQuestions,
    });

  } catch (error) {

    // ================= ERROR RESPONSE =================

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