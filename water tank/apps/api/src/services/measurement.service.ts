import { DeviceStatus, TankStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { deviceRepository } from "../repositories/device.repository.js";
import { measurementRepository } from "../repositories/measurement.repository.js";
import { emitMeasurement } from "../socket/index.js";
import { alertService } from "./alert.service.js";
import { ApiError } from "../utils/errors.js";
import { getRangeStart, type RangeKey } from "../utils/ranges.js";

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const getTankStatus = (percentage: number) => {
  if (percentage >= 80) return TankStatus.FULL;
  if (percentage >= 40) return TankStatus.MEDIUM;
  if (percentage >= 20) return TankStatus.LOW;
  return TankStatus.CRITICAL;
};

export const measurementService = {
  async ingest(input: {
    deviceId: string;
    distance: number;
    percentage: number;
    timestamp?: string;
    wifiRssi?: number;
    wifiSsid?: string;
    ipAddress?: string;
    temperature?: number;
    battery?: number;
    sensorOk?: boolean;
  }) {
    const device = await deviceRepository.findByDeviceId(input.deviceId);
    if (!device) {
      throw new ApiError(404, `Device ${input.deviceId} is not registered`);
    }

    if (!device.tank) {
      throw new ApiError(409, `Device ${input.deviceId} is not assigned to a tank`);
    }

    const recordedAt = input.timestamp ? new Date(input.timestamp) : new Date();
    const isSensorFault = input.sensorOk === false;

    // --- Sensor FAULT path: only update device health, do NOT store bad measurement ---
    if (isSensorFault) {
      const updatedDevice = await prisma.device.update({
        where: { id: device.id },
        data: {
          status: DeviceStatus.ONLINE, // ESP32 is still online — sensor is the issue
          lastSeen: recordedAt,
          sensorOk: false,
          wifiSignal: input.wifiRssi ?? device.wifiSignal,
          wifiSsid: input.wifiSsid ?? device.wifiSsid,
          ipAddress: input.ipAddress ?? device.ipAddress
        }
      });

      // Emit socket event so dashboard badge updates in real-time
      emitMeasurement({ measurement: null, tank: device.tank, device: updatedDevice });

      // Trigger alerting engine
      alertService.evaluate(device.tank, null, updatedDevice, true);

      return { measurement: null, tank: device.tank, device: updatedDevice };
    }

    // --- Normal path: valid sensor reading ---
    // Calculate percentage dynamically based on the dashboard's configured height.
    // This allows users to update tank height in the UI and see readings instantly fix themselves
    // without having to reconfigure the ESP32 hardware!
    let calculatedPercent = input.percentage;
    if (device.tank.heightCm > 0) {
      calculatedPercent = ((device.tank.heightCm - input.distance) / device.tank.heightCm) * 100;
    }

    const percentage = clampPercentage(calculatedPercent);
    const volumeLiters = Math.round(device.tank.capacityLiters * (percentage / 100));
    const status = getTankStatus(percentage);

    const result = await prisma.$transaction(async (tx) => {
      const measurement = await tx.measurement.create({
        data: {
          deviceId: device.id,
          tankId: device.tank!.id,
          distanceCm: input.distance,
          percentage,
          volumeLiters,
          wifiRssi: input.wifiRssi,
          temperatureC: input.temperature,
          batteryPct: input.battery,
          recordedAt
        }
      });

      const tank = await tx.tank.update({
        where: { id: device.tank!.id },
        data: {
          currentPercent: percentage,
          currentDistanceCm: input.distance,
          currentVolumeLiters: volumeLiters,
          status
        }
      });

      const updatedDevice = await tx.device.update({
        where: { id: device.id },
        data: {
          status: DeviceStatus.ONLINE,
          lastSeen: recordedAt,
          sensorOk: true, // Reading was valid, sensor is healthy
          wifiSignal: input.wifiRssi ?? device.wifiSignal,
          wifiSsid: input.wifiSsid ?? device.wifiSsid,
          ipAddress: input.ipAddress ?? device.ipAddress
        }
      });

      return { measurement, tank, device: updatedDevice };
    });

    emitMeasurement(result);

    // Trigger alerting engine
    alertService.evaluate(result.tank, result.measurement, result.device, false);

    return result;
  },

  latest(tankId?: string) {
    return measurementRepository.latest(tankId);
  },

  history(input: { tankId?: string; range: RangeKey; page?: number; limit?: number }) {
    return measurementRepository.history(input.tankId, getRangeStart(input.range), input.page, input.limit);
  }
};
