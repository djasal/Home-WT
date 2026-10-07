import { prisma } from "../config/prisma.js";

export const userRepository = {
  count: () => prisma.user.count(),
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } })
};
