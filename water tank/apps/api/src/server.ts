import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initSocket } from "./socket/index.js";

const server = http.createServer(app);
initSocket(server);

server.listen(env.API_PORT, "0.0.0.0", () => {
  logger.info(`WaterTank API listening on http://0.0.0.0:${env.API_PORT}`);
  watchCloudflareTunnel();
});

function watchCloudflareTunnel() {
  const logFile = "/tmp/tunnel/cloudflared.log";
  
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  logger.info("Watching for Cloudflare Quick Tunnel URL...");
  
  let attempts = 0;
  let lastSentUrl = "";
  
  const interval = setInterval(async () => {
    attempts++;
    if (attempts > 30) {
      clearInterval(interval);
      logger.warn("Stopped watching for Cloudflare URL (timeout).");
      return;
    }

    try {
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, "utf-8");
        const matches = content.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
        
        if (matches && matches.length > 0) {
          const url = matches[matches.length - 1]; // Get the newest one
          
          if (url !== lastSentUrl) {
            lastSentUrl = url;
            clearInterval(interval);
            
            logger.info(`Found NEW Cloudflare Tunnel URL: ${url}`);
          
          // Send to Telegram
          const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          await fetch(tgUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: env.TELEGRAM_CHAT_ID,
              text: `🚀 *Dashboard is Live!*\n\nYour new Cloudflare Tunnel URL is ready:\n${url}\n\n_Note: This link changes every time you restart your server._`,
              parse_mode: "Markdown"
            })
          });
          }
        }
      }
    } catch (e) {
      // Ignore read errors
    }
  }, 2000);
}
