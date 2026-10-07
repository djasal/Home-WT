import { prisma } from "../config/prisma.js";
import { deviceRepository } from "../repositories/device.repository.js";
import { measurementRepository } from "../repositories/measurement.repository.js";
import { tankRepository } from "../repositories/tank.repository.js";
import { getRangeStart, type RangeKey } from "../utils/ranges.js";

import type { User } from "@prisma/client";

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const dashboardService = {
  async summary(user: User, range: RangeKey = "today", requestedTankId?: string) {
    const tankWhere = user.role === "ADMIN" ? {} : { ownerId: user.id };
    const deviceWhere = user.role === "ADMIN" ? {} : { ownerId: user.id };

    const tanks = await tankRepository.list(tankWhere);
    const devices = await deviceRepository.list(deviceWhere);
    const activeTank = requestedTankId ? tanks.find(t => t.id === requestedTankId) ?? tanks[0] : tanks[0];
    const tankId = activeTank?.id;

    if (!tankId) {
      return {
        activeTank: null,
        tanks: [],
        devices,
        latest: null,
        history: [],
        stats: { averageToday: 0, averageWeek: 0, highestLevel: 0, lowestLevel: 0 }
      };
    }

    const [latest, history, todayStats, weekStats, allStats] = await Promise.all([
      measurementRepository.latest(tankId),
      measurementRepository.history(tankId, getRangeStart(range)),
      prisma.measurement.aggregate({
        where: { tankId, recordedAt: { gte: startOfToday() } },
        _avg: { percentage: true },
        _max: { percentage: true },
        _min: { percentage: true }
      }),
      prisma.measurement.aggregate({
        where: { tankId, recordedAt: { gte: getRangeStart("7d") } },
        _avg: { percentage: true }
      }),
      prisma.measurement.aggregate({
        where: { tankId },
        _max: { percentage: true },
        _min: { percentage: true }
      })
    ]);

    return {
      activeTank,
      tanks,
      devices,
      latest,
      history,
      stats: {
        averageToday: todayStats._avg.percentage ?? 0,
        averageWeek: weekStats._avg.percentage ?? 0,
        highestLevel: todayStats._max.percentage ?? allStats._max.percentage ?? 0,
        lowestLevel: todayStats._min.percentage ?? allStats._min.percentage ?? 0
      }
    };
  }
};
