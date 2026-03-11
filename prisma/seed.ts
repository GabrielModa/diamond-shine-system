import bcrypt from "bcryptjs";
import { PrismaClient, Role, SupplyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@diamondshine.com" },
    update: {},
    create: { email: "admin@diamondshine.com", role: Role.ADMIN, password },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: "supervisor@diamondshine.com" },
    update: {},
    create: { email: "supervisor@diamondshine.com", role: Role.SUPERVISOR, password },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@diamondshine.com" },
    update: {},
    create: { email: "employee@diamondshine.com", role: Role.EMPLOYEE, password },
  });

  await prisma.supplyRequest.createMany({
    data: [
      { item: "Gloves", quantity: 200, department: "Cleaning", requesterId: employee.id, status: SupplyStatus.PENDING },
      { item: "Mops", quantity: 25, department: "Operations", requesterId: employee.id, status: SupplyStatus.APPROVED },
    ],
  });

  await prisma.feedback.createMany({
    data: [
      { employeeId: employee.id, reviewerId: supervisor.id, score: 9, comments: "Great consistency and quality." },
      { employeeId: employee.id, reviewerId: admin.id, score: 8, comments: "Strong performance, improve reporting detail." },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { recipientId: employee.id, title: "Supply request submitted", message: "Your request for Gloves is pending.", channel: "IN_APP" },
      { recipientId: supervisor.id, title: "Feedback due", message: "Please complete monthly employee feedback.", channel: "IN_APP" },
    ],
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
