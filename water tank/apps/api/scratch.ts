import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const tanks = await prisma.tank.findMany();
  const devices = await prisma.device.findMany();
  const users = await prisma.user.findMany();
  
  console.log("Users:", users.map(u => ({ id: u.id, name: u.name, role: u.role })));
  console.log("Tanks:", tanks.map(t => ({ id: t.id, name: t.name, ownerId: t.ownerId })));
  console.log("Devices:", devices.map(d => ({ id: d.id, deviceId: d.deviceId, ownerId: d.ownerId })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
