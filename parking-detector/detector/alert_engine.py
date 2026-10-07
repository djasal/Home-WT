import time
import requests
import config

class AlertEngine:
    def __init__(self):
        self.last_alert_time = {} # space_id -> timestamp

    def notify_free(self, space_id, cam_name):
        now = time.time()
        
        # Check cooldown
        if space_id in self.last_alert_time:
            elapsed = now - self.last_alert_time[space_id]
            if elapsed < config.ALERT_COOLDOWN_SEC:
                return # Skip, too soon
                
        self.last_alert_time[space_id] = now
        
        message = f"🟢 Parking Space {space_id} is now FREE\n📍 Location: {cam_name}"
        print(f"[ALERT] {message}")
        
        if config.TELEGRAM_BOT_TOKEN and config.TELEGRAM_CHAT_ID:
            try:
                url = f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": config.TELEGRAM_CHAT_ID,
                    "text": message
                }
                requests.post(url, json=payload, timeout=5)
            except Exception as e:
                print(f"[ALERT ERROR] Failed to send Telegram: {e}")
