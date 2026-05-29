import "../src/loadEnv.js";

const { getEmailStatus, verifySmtpConnection, getEmailSetupHint } = await import(
  "../src/services/emailService.js"
);

console.log("setup hint:", getEmailSetupHint() ?? "(none)");
console.log("status:", getEmailStatus());
const verified = await verifySmtpConnection();
console.log("verify:", verified);
