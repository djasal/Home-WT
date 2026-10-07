import "dotenv/config";

const apiUrl = process.env.API_URL ?? "http://localhost:4000/api";
const deviceToken = process.env.DEVICE_INGEST_TOKEN ?? "local-device-token";
const deviceId = process.env.DEVICE_ID ?? "ESP001";

let step = 0;

const sendMeasurement = async () => {
  step += 1;
  const percentage = Math.max(18, Math.min(96, 70 + Math.sin(step / 5) * 14 - step * 0.03));
  const distance = 200 * (1 - percentage / 100);
  const wifiRssi = -55 - Math.round(Math.random() * 12);

  const response = await fetch(`${apiUrl}/device/data`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-device-token": deviceToken
    },
    body: JSON.stringify({
      deviceId,
      distance: Number(distance.toFixed(1)),
      percentage: Number(percentage.toFixed(1)),
      wifiRssi,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Device post failed ${response.status}: ${body}`);
  }

  const data = await response.json();
  console.log(`${new Date().toLocaleTimeString()} ${deviceId}: ${data.measurement.percentage}%`);
};

console.log(`Simulating ${deviceId}. Posting to ${apiUrl}/device/data every 30 seconds.`);
sendMeasurement().catch((error) => console.error(error.message));
setInterval(() => {
  sendMeasurement().catch((error) => console.error(error.message));
}, 30_000);
