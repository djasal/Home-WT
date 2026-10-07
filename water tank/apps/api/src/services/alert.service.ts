import type { Device, Measurement, Tank, Alert } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

class AlertService {
  constructor() {}

  async evaluate(tank: Tank, measurement: Measurement | null, device: Device, isSensorFault: boolean = false) {
    try {
      const alerts = await prisma.alert.findMany({
        where: {
          OR: [{ tankId: tank.id }, { tankId: null, ownerId: tank.ownerId }],
          enabled: true
        }
      });
      for (const alert of alerts) {
        let isTriggered = false;
        let reason = "";

        if (isSensorFault && alert.type === "SENSOR_FAILURE") {
          isTriggered = true;
          reason = `Sensor fault detected on device ${device.deviceId} (Tank: ${tank.name}).`;
        }

        if (measurement && !isSensorFault) {
          logger.info(`Evaluating alert ${alert.type} (threshold: ${alert.threshold}) against measurement ${measurement.percentage}%`);
          if (alert.type === "LOW_LEVEL" && alert.threshold !== null && measurement.percentage <= alert.threshold) {
            isTriggered = true;
            reason = `Tank '${tank.name}' level dropped to ${measurement.percentage}% (below ${alert.threshold}%).`;
          }

          if (alert.type === "HIGH_LEVEL" && alert.threshold !== null && measurement.percentage >= alert.threshold) {
            isTriggered = true;
            reason = `Tank '${tank.name}' level rose to ${measurement.percentage}% (above ${alert.threshold}%).`;
          }
        }

        if (isTriggered) {
          // 1. Bounce Protection: Don't send more than 1 alert every 5 minutes
          const recentNotifs = await prisma.notification.count({
            where: {
              alertId: alert.id,
              createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
            }
          });

          logger.info(`Alert ${alert.type} triggered! recentNotifs: ${recentNotifs}`);

          if (recentNotifs > 0) continue; 

          // 2. Incident Protection: Only alert ONCE per incident (don't spam if it stays triggered)
          const lastNotif = await prisma.notification.findFirst({
            where: { alertId: alert.id },
            orderBy: { createdAt: 'desc' }
          });

          if (lastNotif && measurement) {
            let returnedToNormal = false;
            
            if (alert.type === "LOW_LEVEL" && alert.threshold !== null) {
              const normalMeasurement = await prisma.measurement.findFirst({
                where: {
                  tankId: tank.id,
                  recordedAt: { gt: lastNotif.createdAt },
                  percentage: { gt: alert.threshold }
                }
              });
              if (normalMeasurement) returnedToNormal = true;
            } 
            else if (alert.type === "HIGH_LEVEL" && alert.threshold !== null) {
              const normalMeasurement = await prisma.measurement.findFirst({
                where: {
                  tankId: tank.id,
                  recordedAt: { gt: lastNotif.createdAt },
                  percentage: { lt: alert.threshold }
                }
              });
              if (normalMeasurement) returnedToNormal = true;
            } else {
              returnedToNormal = true;
            }

            logger.info(`Alert ${alert.type} incident check: returnedToNormal=${returnedToNormal}`);
            if (!returnedToNormal) continue;
          }

          logger.info(`Sending alert ${alert.type}!`);
          const fullMessage = `${alert.message}\n\n${reason}`;
          await this.sendTelegramAlert(alert, fullMessage);
        }
      }
    } catch (error) {
      logger.error("Error evaluating alerts", { error });
    }
  }

  private async sendTelegramAlert(alert: Alert, messageBody: string) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      logger.warn("Telegram is not configured. Skipping alert.", { alertId: alert.id });
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: `🚨 *WaterTank Alert*\n\n${messageBody}`,
          parse_mode: "Markdown"
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      logger.info("Sent Telegram alert", { alertId: alert.id });

      await prisma.notification.create({
        data: {
          alertId: alert.id,
          title: `Alert Triggered: ${alert.type}`,
          body: messageBody,
          status: "SENT",
          sentAt: new Date()
        }
      });
    } catch (error) {
      logger.error("Failed to send Telegram message", { alertId: alert.id, error });
      
      await prisma.notification.create({
        data: {
          alertId: alert.id,
          title: `Alert Triggered: ${alert.type}`,
          body: messageBody,
          status: "FAILED"
        }
      });
    }
  }
}

export const alertService = new AlertService();
