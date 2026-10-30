import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientClass: typeof PrismaClient | undefined;
};

// In dev the client is cached on globalThis so hot reloads don't open a new
// connection every time. But after a migration the regenerated client is a
// new class, and the cached instance would keep rejecting the new fields
// ("Unknown argument …") until `npm run dev` was restarted — so the cache is
// only reused while the class is the same one.
function getClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && globalForPrisma.prismaClientClass === PrismaClient) return cached;

  if (cached) void cached.$disconnect().catch(() => {});
  const client = new PrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientClass = PrismaClient;
  return client;
}

export const prisma = process.env.NODE_ENV === "production" ? new PrismaClient() : getClient();
