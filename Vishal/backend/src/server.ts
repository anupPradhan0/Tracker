import app from "./app.js";
import { env } from "./config/env.js";
import { warnEmailConfigOnStartup } from "./services/emailService.js";

warnEmailConfigOnStartup();

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
