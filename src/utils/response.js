exports.success = (res, data, message = "success") => {
  res.json({ message, data });
};

exports.error = (res, message = "error", code = 400) => {
  res.status(code).json({ message });
};
