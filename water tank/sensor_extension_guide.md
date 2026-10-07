# How to Move the ESP32 Inside and Extend the Sensor Wires

This is a professional approach to solving WiFi and accessibility issues with roof-mounted sensors. By moving the "brain" (the ESP32) inside your house and leaving only the "eyes" (the sensor) on the roof, you solve all WiFi, heat, and accessibility problems at once.

## 1. What You Need
*   **Your existing ESP32 and Ultrasonic Sensor** (e.g., HC-SR04 or the waterproof JSN-SR04T).
*   **A standard Ethernet Cable (Cat5e or Cat6)** long enough to reach from your house to the roof (15-20 meters). Ethernet cable is incredibly cheap, durable, and weather-resistant (especially if you buy outdoor-rated Cat6).
*   **Wire strippers and some electrical tape** (or soldering iron / screw terminals if you want it to look neat).

## 2. Why Ethernet Cable? (The Secret to Long Wires)
An Ethernet cable contains 8 tiny wires grouped into 4 "Twisted Pairs". 
The twisting is a neat physics trick that cancels out electrical noise and interference. Over a 20-meter run, a normal straight wire might pick up static electricity that confuses the sensor. The twisted pairs in an Ethernet cable ensure the sensor signals arrive perfectly clean.

## 3. How to Wire It
You will cut the connectors off both ends of the Ethernet cable and strip back the outer jacket to reveal the 8 colored wires. 

To prevent power loss over the 20 meters, we will twist some wires together to make them thicker for the Power (5V) and Ground (GND). 

Here is the best way to map the wires:

| ESP32 Pin (Inside House) | Ethernet Cable Color(s) | Sensor Pin (On Roof) |
| :--- | :--- | :--- |
| **5V / VIN** | 🟠 Orange + 🟤 Brown *(Twist them together)* | **VCC** (Power) |
| **GND** | ⚪ Orange-White + ⚪ Brown-White *(Twist together)* | **GND** (Ground) |
| **Pin 4 (TRIG)** | 🟢 Green | **TRIG** |
| **Pin 5 (ECHO)** | 🔵 Blue | **ECHO** |

*(Leave the Green-White and Blue-White wires disconnected, just snip them off or wrap them in tape).*

## 4. The Massive Benefits of this Setup
*   **Flawless WiFi:** The ESP32 is now sitting comfortably in your living room or garage, right next to your router. It will never drop the WiFi again.
*   **Instant Updates:** Want to change the code? Just walk over to it and plug your laptop in. No ladders required.
*   **Weather Protection:** ESP32s can overheat in summer roofs or freeze in winter. Now, it's in a climate-controlled house. If the cheap sensor on the roof ever breaks due to water or heat, you just swap the sensor (a $2 part) without touching the expensive microcontroller.

## ⚠️ One Thing to Watch Out For
Because the signal has to travel 20 meters down the cable, the "ECHO" pulse might take a tiny fraction of a microsecond longer to arrive. This might cause your water tank depth to read slightly differently (e.g., it might read 50.5 cm instead of 50.0 cm). 
If this happens, you just tweak the `SENSOR_OFFSET_CM` number in your ESP32 code to calibrate it perfectly again!
