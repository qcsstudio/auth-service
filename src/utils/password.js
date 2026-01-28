exports.generateTempPassword = () => {
  return "Abc@" + Math.random().toString(36).slice(-6);
};

exports.generateStrongPassword = () => {
  // Example: 12 char password with letters, numbers, symbols
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
