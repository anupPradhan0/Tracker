import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: categories are created per user on signup.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
