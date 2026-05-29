import type { User } from "@prisma/client";

export function toUserPublic(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferredAiProvider: user.preferredAiProvider,
    currency: user.currency,
    reportSenderEmail: user.reportSenderEmail,
    reportReceiverEmail: user.reportReceiverEmail,
    createdAt: user.createdAt.toISOString(),
  };
}
