import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const deviceRepository = {
  list: (where?: Prisma.DeviceWhereInput) =>
    prisma.device.findMany({
      where,
      include: { tank: true },
      orderBy: { createdAt: "asc" }
    }),

  findFirst: (where: Prisma.DeviceWhereInput) =>
    prisma.device.findFirst({
      where,
      include: { tank: true }
    }),

  findByDeviceId: (deviceId: string) =>
    prisma.device.findUnique({
      where: { deviceId },
      include: { tank: true }
    }),

  create: (data: Prisma.DeviceCreateInput) => prisma.device.create({ data }),
  update: (where: Prisma.DeviceWhereUniqueInput, data: Prisma.DeviceUpdateInput) => prisma.device.update({ where, data }),
  remove: (where: Prisma.DeviceWhereUniqueInput) => prisma.device.delete({ where })
};
