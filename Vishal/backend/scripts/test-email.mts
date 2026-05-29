const {
  getEmailStatus,
  verifySmtpConnection,
  getEmailSetupHint,
  isEmailConfigured,
  getMailAddressDiagnostics,
} = await import("../src/services/emailService.js");

const diagnostics = getMailAddressDiagnostics();
if (diagnostics) {
  console.log("MAIL_USER:", diagnostics.mailUser);
  console.log("MAIL_FROM email:", diagnostics.mailFromEmail ?? "(none / display name only)");
  console.log("addresses match:", diagnostics.addressesMatch);
} else {
  console.log("MAIL_USER: (not set)");
}

console.log("configured:", isEmailConfigured());
console.log("setup hint:", getEmailSetupHint() ?? "(none)");
console.log("status:", getEmailStatus());
const verified = await verifySmtpConnection();
console.log("verify:", verified);
