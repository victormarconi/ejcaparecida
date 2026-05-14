import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@ejc.local";
  const username = process.env.ADMIN_USERNAME || "ejcaparecida";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Administrador EJC",
      email,
      username,
      passwordHash: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
