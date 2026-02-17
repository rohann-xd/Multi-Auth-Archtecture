const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const {
  HRM_CLIENT_ID,
  HRM_CLIENT_SECRET,
  CRM_CLIENT_ID,
  CRM_CLIENT_SECRET,
} = require("../config/config");

const clients = [
  {
    clientId: HRM_CLIENT_ID,
    clientName: "HRM Application",
    clientSecret: HRM_CLIENT_SECRET,
  },
  {
    clientId: CRM_CLIENT_ID,
    clientName: "CRM Application",
    clientSecret: CRM_CLIENT_SECRET,
  },
];

const seedClients = async () => {
  // Validate env variables first
  if (!HRM_CLIENT_ID || !HRM_CLIENT_SECRET) {
    console.error("HRM client credentials are missing in .env");
    process.exit(1);
  }

  if (!CRM_CLIENT_ID || !CRM_CLIENT_SECRET) {
    console.error("CRM client credentials are missing in .env");
    process.exit(1);
  }

  console.log("Seeding clients...");

  for (const client of clients) {
    const existing = await prisma.client.findFirst({
      where: { clientId: client.clientId },
    });

    if (existing) {
      console.log(`Client ${client.clientId} already exists, skipping.`);
      continue;
    }

    const hashedSecret = await bcrypt.hash(client.clientSecret, 10);

    await prisma.client.create({
      data: {
        clientId: client.clientId,
        clientName: client.clientName,
        clientSecret: hashedSecret,
        isActive: true,
      },
    });

    console.log(`Client ${client.clientId} created successfully.`);
  }

  console.log("Seeding complete.");
  await prisma.$disconnect();
};

seedClients().catch((err) => {
  console.error("Seed failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
