import type { Profile } from "passport-google-oauth20";
import { prisma } from "../lib/prisma.js";
import type { SafeUser } from "../types/api.js";

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  provider: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    provider: user.provider,
    createdAt: user.createdAt,
  };
}

export async function findOrCreateFromGoogle(profile: Profile) {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error("Google profile missing email");
  }

  const name = profile.displayName || email.split("@")[0];
  const image = profile.photos?.[0]?.value ?? null;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      image,
      provider: "google",
    },
    update: {
      name,
      image,
    },
  });

  return user;
}

export async function findUserById(id: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return toSafeUser(user);
}

export { toSafeUser };
