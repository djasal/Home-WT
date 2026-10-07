import bcrypt from "bcryptjs";
import { DeviceStatus, Role, TankShape, TankStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";

const seed = async () => {
  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@watertank.local" },
    update: {},
    create: {
      name: "WaterTank Admin",
      email: "admin@watertank.local",
      passwordHash,
      role: Role.ADMIN,
      settings: { create: { timezone: "Africa/Algiers" } }
    }
  });

  let tank = await prisma.tank.findFirst({ where: { name: "Main Rooftop Tank" } });
  if (!tank) {
    tank = await prisma.tank.create({
      data: {
        name: "Main Rooftop Tank",
        location: "Local test site",
        capacityLiters: 5000,
        heightCm: 200,
        diameterCm: 180,
        shape: TankShape.CYLINDER,
        ownerId: admin.id,
        currentPercent: 74,
        currentDistanceCm: 52,
        currentVolumeLiters: 3700,
        status: TankStatus.MEDIUM,
        notes: "Phase 1 test tank connected to ESP001"
      }
    });
  }

  const device = await prisma.device.upsert({
    where: { deviceId: "ESP001" },
    update: { tankId: tank.id, ownerId: admin.id },
    create: {
      ownerId: admin.id,
      deviceId: "ESP001",
      macAddress: "A4:CF:12:34:56:78",
      firmwareVersion: "1.0.0",
      ipAddress: "192.168.1.44",
      wifiSignal: -57,
      sensorType: "JSN-SR04T",
      status: DeviceStatus.ONLINE,
      lastSeen: new Date(),
      tankId: tank.id
    }
  });

  const existingMeasurements = await prisma.measurement.count({ where: { tankId: tank.id } });
  if (existingMeasurements === 0) {
    const now = Date.now();
    const data = Array.from({ length: 72 }, (_, index) => {
      const minutesAgo = (71 - index) * 20;
      const wave = Math.sin(index / 6) * 8;
      const trend = index * 0.08;
      const percentage = Math.max(24, Math.min(96, 68 + wave + trend));
      const distanceCm = Math.max(8, tank.heightCm * (1 - percentage / 100));
      return {
        deviceId: device.id,
        tankId: tank.id,
        distanceCm: Number(distanceCm.toFixed(1)),
        percentage: Number(percentage.toFixed(1)),
        volumeLiters: Math.round(tank.capacityLiters * (percentage / 100)),
        wifiRssi: -58 + (index % 7),
        recordedAt: new Date(now - minutesAgo * 60 * 1000)
      };
    });

    await prisma.measurement.createMany({ data });
  }

  console.log("Seed complete");
  console.log("Login: admin@watertank.local / Admin123!");
  console.log("Device: ESP001 with x-device-token local-device-token");
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
