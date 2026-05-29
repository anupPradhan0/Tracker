import { z } from "zod";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/constants/auth";

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, "Password must be at least 4 characters")
  .max(PASSWORD_MAX, "Password cannot exceed 8 characters");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
