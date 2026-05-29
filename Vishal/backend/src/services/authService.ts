import type { Profile } from "passport-google-oauth20";
import { findOrCreateFromGoogle, toSafeUser } from "./userService.js";
import { signToken } from "./tokenService.js";

export async function handleGoogleLogin(profile: Profile) {
  const user = await findOrCreateFromGoogle(profile);
  const token = signToken({ sub: user.id, email: user.email });
  return { user: toSafeUser(user), token };
}
