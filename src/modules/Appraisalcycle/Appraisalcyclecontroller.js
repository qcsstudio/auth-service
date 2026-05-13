const AppraisalCycle = require("./Appraisalcycleschema");

const normalizeArray = (val) => {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [val];
};

exports.createCycle = async (req, res) => {
  try {

    const adminId = req.user?._id;
    const companyId = req.user?.companyId;
    const {
      name,
      description,
      cycleType,
      startDate,
      endDate,
      reviewDeadline,
      applicableDepartments,
      applicableJobGrades,
      reviewerWeights,
      reviewerSelection,
      selectedCompetencies,
      formSections,
      overallAssessment,
      workflow,
      notifications,
      status,
      launchedAt,
      closedAt,
    } = req.body;

    if (!companyId || !name) {
      return res.status(400).json({
        success: false,
        message: "companyId and name are required",
      });
    }

    // const allowedStatus = ["draft", "active", "closed", "archived"];

    // if (status && !allowedStatus.includes(status)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid status value",
    //   });
    // }

    const payload = {
      companyId,
      adminId,
      name,
      description,
      cycleType,
      startDate,
      endDate,
      reviewDeadline,
      applicableDepartments: normalizeArray(applicableDepartments),
      applicableJobGrades: normalizeArray(applicableJobGrades),
      selectedCompetencies: normalizeArray(selectedCompetencies),
      formSections: Array.isArray(formSections) ? formSections : [],
      reviewerWeights,
      reviewerSelection,
      overallAssessment,
      workflow,
      notifications,
      status,
      launchedAt,
      closedAt,
      createdBy: req.user?._id || null,
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    const cycle = await AppraisalCycle.create(payload);

    return res.status(201).json({
      success: true,
      message: "Appraisal cycle created successfully",
      data: cycle,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.checkCompanyCycleExists = async (req, res) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID not found in user",
      });
    }

    const exists = await AppraisalCycle.exists({ companyId });

    return res.status(200).json({
      exists: !!exists,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      exists: false,
      message: error.message,
    });
  }
};