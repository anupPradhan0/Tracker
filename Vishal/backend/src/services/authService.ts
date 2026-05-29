import bcrypt from "bcrypt";
import { BCRYPT_ROUNDS } from "../constants/auth.constants.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "./tokenService.js";
import { createUser, findByEmail, toSafeUser } from "./userService.js";
import type { SafeUser } from "../types/api.js";

export interface AuthSession {
  user: SafeUser;
  token: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthSession> {
  const existing = await findByEmail(input.email);
  if (existing) {
    throw new ApiError(409, "USER_EXISTS", "User already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return issueSession(user);
}

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const user = await findByEmail(input.email);
  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  return issueSession(toSafeUser(user));
}

function issueSession(user: SafeUser): AuthSession {
  const token = signToken({ sub: user.id, email: user.email });
  return { user, token };
}
