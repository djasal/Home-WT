# First-Time Setup Guide

Welcome to the **WaterTank Monitor** project! This guide covers the simplest way to get the entire stack (PostgreSQL database, Node.js API, and React Web Dashboard) running on a brand-new machine using Docker.

## Prerequisites

Before starting, ensure the new machine has the following installed:

- **Docker Desktop** (or Docker Engine with Docker Compose plugin)
- **Git** (to clone the repository)

> [!NOTE]
> Since we run everything inside Docker, you **do not** need to install Node.js, npm, or PostgreSQL on your host machine.

## Step-by-Step Setup

### 1. Clone the Repository
Clone the codebase to your local machine and navigate into the project directory:
```bash
git clone <repository_url>
cd "water tank"
```
*(Replace `<repository_url>` with the actual Git URL of this project).*

### 2. Configure Environment Variables
The project uses environment variables to configure database connections, Telegram credentials, and API URLs.

1. Copy the provided `.env.example` file to create your local `.env` file:
   - On Windows (Command Prompt / PowerShell):
     ```cmd
     copy .env.example .env
     ```
   - On Mac/Linux:
     ```bash
     cp .env.example .env
     ```
2. Open the newly created `.env` file and review the values. The default local configurations are already set up to work out-of-the-box with Docker. (Add any Telegram Bot credentials here if you plan to test push alerts).

### 3. Start the Application
With Docker running, execute the following command in the root directory to build and start the containers:

```bash
docker compose up -d
```

> [!TIP]
> The `-d` flag runs the containers in detached mode, meaning they will run in the background.

**What happens next?**
The `docker compose` command will automatically:
1. Download the necessary PostgreSQL and Node.js images.
2. Boot up the `watertank-postgres` database container.
3. Start the `watertank-app` container.
4. Inside the app container, it will automatically install npm packages, generate the Prisma ORM client, push the database schema, seed initial test data, and start the development servers for both the API and Web Dashboard.

Wait a couple of minutes for all these initialization tasks to complete. You can monitor the progress by checking the app logs:
```bash
docker logs -f watertank-app
```
*(Press `Ctrl + C` to stop watching the logs).*

### 4. Access the Application

Once the initialization is finished, you can access the application locally:

- **Web Dashboard:** [http://localhost:5173](http://localhost:5173)
- **API Server:** [http://localhost:4000](http://localhost:4000)

**Seeded Test Credentials:**
- **Email:** `admin@watertank.local`
- **Password:** `Admin123!`

### 5. Simulate IoT Devices (Optional)
To test real-time Socket.IO dashboard updates, you can run the ESP32 hardware simulator. 

First, ensure you have Node.js installed locally to run this script, or execute it directly inside the running container:
```bash
docker exec -it watertank-app npm run simulate:esp32
```
This will start generating dummy telemetry data and pushing it to your local backend, which will instantly reflect on your Web Dashboard!

### 6. Physical ESP32 Setup (Optional)
If you have a physical ESP32-C3 Super Mini device that you want to flash and connect to your home network:

1. Flash the `esp32_watertank.ino` firmware located in the `hardware/esp32_watertank/` directory using the Arduino IDE.
2. **Connecting to WiFi (Captive Portal):** 
   - The device uses the **WiFiManager** library, so you **do not** hardcode your Wi-Fi credentials. 
   - When the ESP32 starts up for the first time (or if it can't find a known network), it creates its own Wi-Fi network called **`WaterTank-Setup`**.
   - Connect to this network using your smartphone or laptop.
   - A captive portal will pop up (if not, navigate to `http://192.168.4.1` in your browser).
3. **Configure Settings:**
   - Click **Configure WiFi**.
   - Select your home Wi-Fi network and enter its password.
   - **Crucially:** Update the **API URL** parameter on the same screen to point to your computer's actual local IPv4 address (e.g. `http://192.168.1.50:4000/api/device/data`). Do not use `localhost` because that points to the ESP32 itself!
4. **Save & Reboot:** Click Save. The ESP32 will reboot, drop the temporary setup network, and join your home network. You can watch the Serial Monitor in the Arduino IDE (at `115200` baud) to confirm the connection and see incoming data.

## Troubleshooting
- **Database Connection Errors:** Ensure no other local PostgreSQL instance is running on port `5433` (the port mapped to the host).
- **Restarting the App:** If the app container crashes or you need to restart it, simply run:
  ```bash
  docker restart watertank-app
  ```
- **Wiping Data:** If you want to reset everything and clear the database:
  ```bash
  docker compose down -v
  ```
  *(This will stop the containers and delete the database volume).*
