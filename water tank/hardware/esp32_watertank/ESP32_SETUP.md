# ESP32-C3 Super Mini Setup Guide

This guide explains how to configure and link your ESP32-C3 Super Mini to the WaterTank Monitor application using the provided `esp32_watertank.ino` firmware.

## 1. Hardware Wiring

You will need an Ultrasonic Distance Sensor (like the waterproof `JSN-SR04T` or standard `HC-SR04`). Wire it to your ESP32-C3 Super Mini as follows:

*   **VCC:** 5V or 3.3V *(Check your specific sensor's requirement)*
*   **GND:** GND
*   **Trig:** Pin 4
*   **Echo:** Pin 5 

## 2. Software Setup

1.  Open the `esp32_watertank.ino` file in the **Arduino IDE**.
2.  Go to **Sketch > Include Library > Manage Libraries...**
3.  Search for **`ArduinoJson`** (by Benoit Blanchon) and install it.
4.  Search for **`WiFiManager`** (by tzapu) and install it.
5.  Ensure you have the ESP32 board definitions installed in your Boards Manager.
6.  Select **"ESP32C3 Dev Module"** (or a specific Super Mini profile if available) from the **Tools > Board** menu.

## 3. Configure the Code

Before clicking upload, you must change the `API_URL` variable at the top of the `esp32_watertank.ino` code to match your specific environment:

```cpp
// ⚠️ IMPORTANT: Change 192.168.1.100 to the actual local IP address 
// of the computer running the Docker container!
const char* API_URL       = "http://192.168.1.100:4000/api/device/data"; 
```

> **Note:** Your ESP32 cannot use `localhost` because that refers to the ESP32 itself. It needs the actual IPv4 address of your computer on your local home Wi-Fi network (e.g., `192.168.1.50`).
> 
> **WiFi Setup:** You no longer hardcode your WiFi credentials! When you turn on the ESP32 for the first time, it will broadcast a WiFi network called **WaterTank-Setup**. Connect to it with your phone, and a portal will pop up asking you to select your home WiFi and enter the password.

### 🔄 Over-The-Air (OTA) Updates
After uploading the code via USB for the first time, your ESP32 will show up as a Network Port in the Arduino IDE (**Tools > Port > Network Ports**). You can now push code updates wirelessly!

## 4. Upload and Test

1.  Connect your ESP32-C3 Super Mini to your computer via USB.
2.  Select the correct COM port in the Arduino IDE (**Tools > Port**).
3.  Click the **Upload** button.
4.  Once the upload finishes, open the **Serial Monitor** (set the baud rate to **115200**). 

### What to expect:
You should see the device connect to your Wi-Fi, take a distance measurement, and send a JSON payload to your server. 

If you open the Web Dashboard ([http://localhost:5173](http://localhost:5173)), you will see the water level update in real-time as the ESP32 sends new data every 30 seconds!
