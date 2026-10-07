import { prisma } from "../config/prisma.js";
import type { User } from "@prisma/client";

export const analyticsService = {
  async getFleetAnalytics(user: User) {
    const tankWhere = user.role === "ADMIN" ? {} : { ownerId: user.id };
    
    const tanks = await prisma.tank.findMany({
      where: tankWhere,
      include: { devices: true }
    });
    
    const tankIds = tanks.map(t => t.id);

    if (!tankIds.length) {
      return { totalTanks: 0, totalCapacity: 0, currentStored: 0, averageHealth: 0, alertsCount: 0 };
    }

    const totalCapacity = tanks.reduce((sum, t) => sum + t.capacityLiters, 0);
    const currentStored = tanks.reduce((sum, t) => sum + t.currentVolumeLiters, 0);

    const alertsCount = await prisma.alert.count({
      where: { tankId: { in: tankIds }, enabled: true }
    });

    const averageHealth = tanks.length 
      ? tanks.reduce((sum, t) => sum + t.currentPercent, 0) / tanks.length 
      : 0;

    return {
      totalTanks: tanks.length,
      totalCapacity,
      currentStored,
      averageHealth: Math.round(averageHealth),
      alertsCount,
      tanks: tanks.map(t => ({
        id: t.id,
        name: t.name,
        capacity: t.capacityLiters,
        current: t.currentVolumeLiters,
        percentage: Math.round(t.currentPercent),
        status: t.status
      }))
    };
  }
};
