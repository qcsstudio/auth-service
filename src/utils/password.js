exports.generateTempPassword = () => {
  return "Abc@" + Math.random().toString(36).slice(-6);
};
