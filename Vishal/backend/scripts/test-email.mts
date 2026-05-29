const { getEmailStatus, verifySmtpConnection, getEmailSetupHint, isEmailConfigured } =
  await import("../src/services/emailService.js");

console.log("configured:", isEmailConfigured());
console.log("setup hint:", getEmailSetupHint() ?? "(none)");
console.log("status:", getEmailStatus());
const verified = await verifySmtpConnection();
console.log("verify:", verified);
