#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>  // Make sure to install ArduinoJson library in Arduino IDE
#include <WiFiManager.h>  // Install WiFiManager by tzapu in Arduino IDE
#include <ArduinoOTA.h>   // Included in ESP32 board package
#include <WebServer.h>    // For local HTTP server to receive dashboard commands
#include <Preferences.h>  // To save config to NVS

// ==========================================
// TELNET SERIAL (Removed to save memory)
// ==========================================
#define TS Serial
// ==========================================
// CONFIGURATION
// ==========================================
WebServer server(80);

// Variables for dynamic provisioning
char apiUrl[100] = "http://192.168.1.11:4000/api/device/data";
char deviceToken[50] = "local-device-token";
char deviceId[20] = "ESP001";

const char* OTA_PASSWORD = "hgfvhmdk@ESP32";  // Password required to push OTA updates

// Flag for saving data from WiFiManager
bool shouldSaveConfig = false;

// Callback notifying us of the need to save config
void saveConfigCallback() {
  Serial.println("Should save config");
  shouldSaveConfig = true;
}

// Sensor Pins (ESP32-C3 Super Mini)
// Adjust these based on exactly where you plug in your ultrasonic sensor
const int TRIG_PIN = 4;
const int ECHO_PIN = 5;

// Tank Settings (in cm)
const float TANK_HEIGHT_CM = 200.0;   // Total height of the tank
const float SENSOR_OFFSET_CM = 10.0;  // Distance from sensor to the absolute "full" water line

// Reporting interval
const unsigned long REPORT_INTERVAL_MS = 30000;  // 30 seconds
unsigned long lastReportTime = 0;

// WiFi Reconnect Variables
unsigned long lastWifiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 10000; // Check every 10 seconds
unsigned long wifiDisconnectTime = 0;
bool isWifiDisconnected = false;
const unsigned long WIFI_TIMEOUT_REBOOT = 300000; // Reboot after 5 minutes (300,000 ms) of no WiFi

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // 1. WiFiManager Setup (Captive Portal)
  WiFiManager wm;

  // IMPORTANT FIX: If router is down, only keep the AP open for 3 minutes.
  // After 3 minutes, it will exit and allow our loop() to restart the ESP32 to try again!
  wm.setConfigPortalTimeout(180); 

  // wm.resetSettings(); // Un-comment ONLY when you want to clear saved WiFi (e.g., testing)

  wm.setSaveConfigCallback(saveConfigCallback);

  // Load from NVS
  Preferences preferences;
  preferences.begin("watertank", false);
  
  // FORCE OVERWRITE OLD MEMORY:
  preferences.putString("api_url", "http://192.168.1.11:4000/api/device/data");

  if (preferences.isKey("api_url")) {
    String url = preferences.getString("api_url", apiUrl);
    url.toCharArray(apiUrl, sizeof(apiUrl));
  }
  if (preferences.isKey("device_id")) {
    String id = preferences.getString("device_id", deviceId);
    id.toCharArray(deviceId, sizeof(deviceId));
  }
  if (preferences.isKey("device_token")) {
    String token = preferences.getString("device_token", deviceToken);
    token.toCharArray(deviceToken, sizeof(deviceToken));
  }
  preferences.end();

  WiFiManagerParameter custom_api_url("api_url", "API URL", apiUrl, 100);
  WiFiManagerParameter custom_device_id("device_id", "Device ID", deviceId, 20);
  WiFiManagerParameter custom_device_token("device_token", "Device Token", deviceToken, 50);

  wm.addParameter(&custom_api_url);
  wm.addParameter(&custom_device_id);
  wm.addParameter(&custom_device_token);

  Serial.println("Connecting to WiFi or starting Captive Portal...");
  
  // BOOST WIFI SIGNAL FOR C3 SUPER MINI
  WiFi.setTxPower(WIFI_POWER_19_5dBm);
  
  // DIRECT HARDCODED CONNECTION (Bypass Captive Portal entirely)
  Serial.println("Connecting directly to Home WiFi...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin("Home", "hgfvhmdk@WF2710"); // <--- Hardcoded here!
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Save configuration if updated via captive portal (skipped here, but keeping logic)
  if (shouldSaveConfig) {
    strcpy(apiUrl, custom_api_url.getValue());
      strcpy(deviceId, custom_device_id.getValue());
      strcpy(deviceToken, custom_device_token.getValue());

      Serial.println("Saving updated configuration to NVS...");
      preferences.begin("watertank", false);
      preferences.putString("api_url", apiUrl);
      preferences.putString("device_id", deviceId);
      preferences.putString("device_token", deviceToken);
      preferences.end();
    }

    // Telnet log removed to save space
    // TS.begin();
    Serial.println("Telnet log removed to save memory.");

  // 2. Arduino OTA Setup
  ArduinoOTA.setHostname("WaterTank-ESP32");
  ArduinoOTA.setPassword(OTA_PASSWORD);  // Require password for OTA updates
  ArduinoOTA.onStart([]() {
    TS.println("OTA update starting...");
  });
  ArduinoOTA.onEnd([]() {
    TS.println("\nOTA update complete.");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    TS.printf("OTA Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    TS.printf("OTA Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) TS.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) TS.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) TS.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) TS.println("Receive Failed");
    else if (error == OTA_END_ERROR) TS.println("End Failed");
  });
  ArduinoOTA.begin();

  // 3. Local Web Server Setup (To receive commands from dashboard)
  server.on("/reset-wifi", HTTP_POST, []() {
    TS.println("Dashboard requested WiFi Reset. Resetting...");

    // Send success response to dashboard
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"success\", \"message\":\"Resetting WiFi. The ESP32 will restart in AP mode.\"}");

    delay(1000);  // Wait for response to send

    // Reset WiFiManager settings and reboot
    WiFiManager wm;
    wm.resetSettings();
    ESP.restart();
  });

  // CORS handling for preflight requests from a web dashboard
  server.on("/reset-wifi", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  server.on("/change-wifi", HTTP_POST, []() {
    TS.println("Dashboard requested WiFi Change.");
    if (server.hasArg("plain") == false) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(400, "application/json", "{\"status\":\"error\", \"message\":\"No body\"}");
      return;
    }

    String body = server.arg("plain");
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, body);

    if (error) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(400, "application/json", "{\"status\":\"error\", \"message\":\"Invalid JSON\"}");
      return;
    }

    String new_ssid = doc["ssid"].as<String>();
    String new_password = doc["password"].as<String>();

    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "application/json", "{\"status\":\"success\", \"message\":\"Saving WiFi and restarting...\"}");

    delay(1000);  // Wait for response to send

    TS.print("Saving new SSID: ");
    TS.println(new_ssid);

    // Save credentials using WiFiManager so they persist across reboots
    WiFiManager wm;
    wm.resetSettings();  // Clear old credentials
    WiFi.begin(new_ssid.c_str(), new_password.c_str());

    unsigned long startAttempt = millis();
    TS.print("Connecting");
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
      delay(500);
      TS.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
      // Save credentials so WiFiManager remembers them on next boot
      WiFiManager wmSave;
      wmSave.autoConnect("WaterTank-Setup");
    } else {
      TS.println("\nFailed to connect. Restarting into AP mode...");
    }

    ESP.restart();  // Restart so WiFiManager picks up the new network cleanly
  });

  server.on("/change-wifi", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  server.on("/scan-wifi", HTTP_GET, []() {
    TS.println("Dashboard requested WiFi Scan.");
    server.sendHeader("Access-Control-Allow-Origin", "*");

    int n = WiFi.scanNetworks();
    TS.println("Scan complete");

    DynamicJsonDocument doc(2048);
    JsonArray networks = doc.createNestedArray("networks");

    if (n > 0) {
      for (int i = 0; i < n; ++i) {
        JsonObject net = networks.createNestedObject();
        net["ssid"] = WiFi.SSID(i);
        net["rssi"] = WiFi.RSSI(i);
        net["encryption"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "open" : "secure";
      }
    }

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    server.send(200, "application/json", jsonPayload);

    WiFi.scanDelete();  // Clean up memory
  });

  server.on("/scan-wifi", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  server.begin();
  TS.println("HTTP Server started.");
}

void loop() {
  // Handle OTA clients every loop
  ArduinoOTA.handle();

  // Handle incoming HTTP requests from dashboard
  server.handleClient();

  unsigned long currentMillis = millis();

  // Non-blocking WiFi reconnect logic
  if (WiFi.status() != WL_CONNECTED) {
    if (!isWifiDisconnected) {
      TS.println("WiFi connection lost. Starting disconnection timer...");
      isWifiDisconnected = true;
      wifiDisconnectTime = currentMillis;
    }
    
    // Attempt reconnect every 10 seconds without blocking
    if (currentMillis - lastWifiCheck >= WIFI_CHECK_INTERVAL) {
      lastWifiCheck = currentMillis;
      TS.println("Attempting WiFi reconnect...");
      WiFi.disconnect();
      WiFi.reconnect(); // Uses WiFiManager's stored credentials
    }
    
    // Reboot if disconnected for too long (5 minutes)
    if (currentMillis - wifiDisconnectTime >= WIFI_TIMEOUT_REBOOT) {
      TS.println("Failed to reconnect to WiFi for 5 minutes. Rebooting ESP32!");
      ESP.restart();
    }
  } else {
    // We are connected
    if (isWifiDisconnected) {
      TS.println("WiFi reconnected successfully!");
      isWifiDisconnected = false;
    }
  }

  // Check if it's time to send a new measurement
  if (millis() - lastReportTime >= REPORT_INTERVAL_MS) {
    lastReportTime = millis();

    float distance = measureDistance();

    TS.print("[DIAG] measureDistance() returned: ");
    TS.println(distance);

    // Safety check - ignore highly erroneous readings
    if (distance > 0 && distance < 400) {
      float percentage = calculatePercentage(distance);
      float internalTemp = temperatureRead();
      TS.print("[DIAG] Sensor OK - sending measurement. Percentage: ");
      TS.println(percentage);
      sendMeasurement(distance, percentage, internalTemp, true);
    } else {
      TS.println("[DIAG] Sensor FAULT - distance out of range. Sending sensorOk=false heartbeat.");
      float internalTemp = temperatureRead();
      sendMeasurement(-1.0, 0.0, internalTemp, false);
    }
  }
}

// connectWiFi() has been replaced by WiFiManager

float measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  // Trigger a 10-microsecond pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Measure the echo duration
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout

  if (duration == 0) return -1.0;  // Timeout

  // Speed of sound is 0.034 cm/us. Distance is duration * 0.034 / 2 (round trip)
  float distance = duration * 0.034 / 2.0;
  return distance;
}

float calculatePercentage(float currentDistance) {
  // Calculate how full the tank is based on distance
  float waterDepth = TANK_HEIGHT_CM - (currentDistance - SENSOR_OFFSET_CM);
  float percentage = (waterDepth / TANK_HEIGHT_CM) * 100.0;

  TS.print("-> Raw Distance: ");
  TS.print(currentDistance);
  TS.print(" cm | Water Depth: ");
  TS.print(waterDepth);
  TS.print(" cm | Calculated: ");
  TS.print(percentage);
  TS.println("%");

  // Constrain between 0 and 100
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;

  return percentage;
}

void sendMeasurement(float distance, float percentage, float internalTemp, bool sensorOk) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiUrl);

    // Headers required by your backend
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-token", deviceToken);

    // Build JSON payload
    StaticJsonDocument<256> doc;
    doc["deviceId"] = deviceId;
    doc["distance"] = distance;
    doc["percentage"] = percentage;
    doc["temperature"] = internalTemp;
    doc["wifiRssi"] = WiFi.RSSI();
    doc["wifiSsid"] = WiFi.SSID();
    doc["ipAddress"] = WiFi.localIP().toString();
    doc["sensorOk"] = sensorOk;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    TS.print("Sending data: ");
    TS.println(jsonPayload);

    // Send POST request
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      TS.print("HTTP Response code: ");
      TS.println(httpResponseCode);
    } else {
      TS.print("Error code: ");
      TS.println(httpResponseCode);
    }

    http.end();
  }
}
