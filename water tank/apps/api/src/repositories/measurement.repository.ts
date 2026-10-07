import { prisma } from "../config/prisma.js";

export const measurementRepository = {
  latest: (tankId?: string) =>
    prisma.measurement.findFirst({
      where: tankId ? { tankId } : undefined,
      include: { device: true, tank: true },
      orderBy: { recordedAt: "desc" }
    }),

  history: async (tankId: string | undefined, since: Date, page?: number, limit?: number) => {
    const where = {
      ...(tankId ? { tankId } : {}),
      recordedAt: { gte: since }
    };

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        prisma.measurement.findMany({
          where,
          include: { device: true, tank: true },
          orderBy: { recordedAt: "desc" },
          skip,
          take: limit
        }),
        prisma.measurement.count({ where })
      ]);
      return { items, total, page, limit };
    }

    // Default legacy behavior for dashboard (no pagination)
    return prisma.measurement.findMany({
      where,
      include: { device: true, tank: true },
      orderBy: { recordedAt: "asc" } // Dashboard expects asc
    });
  }
};
