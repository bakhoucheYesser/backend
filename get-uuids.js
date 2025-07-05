const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.estimate.findMany({
  select: { id: true, pickupAddress: true }
}).then(estimates => {
  console.log("📋 UUIDs disponibles:");
  estimates.forEach((est, i) => {
    console.log(`${i+1}. ${est.id}`);
  });
}).finally(() => prisma.$disconnect());
