import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const tankRepository = {
  list: (where?: Prisma.TankWhereInput) =>
    prisma.tank.findMany({
      where,
      include: { devices: true },
      orderBy: { createdAt: "asc" }
    }),

  findFirst: (where: Prisma.TankWhereInput) =>
    prisma.tank.findFirst({
      where,
      include: {
        devices: true,
        measurements: {
          orderBy: { recordedAt: "desc" },
          take: 1
        }
      }
    }),

  create: (data: Prisma.TankCreateInput) => prisma.tank.create({ data }),
  update: (where: Prisma.TankWhereUniqueInput, data: Prisma.TankUpdateInput) => prisma.tank.update({ where, data }),
  remove: (where: Prisma.TankWhereUniqueInput) => prisma.tank.delete({ where })
};
