import bcrypt from "bcryptjs";
import { PrismaClient, Role, SupplyPriority, SupplyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({ where: { email: "admin@diamondshine.com" }, update: { role: Role.ADMIN, password }, create: { email: "admin@diamondshine.com", role: Role.ADMIN, password } });
  const supervisor = await prisma.user.upsert({ where: { email: "supervisor@diamondshine.com" }, update: { role: Role.SUPERVISOR, password }, create: { email: "supervisor@diamondshine.com", role: Role.SUPERVISOR, password } });
  const employee = await prisma.user.upsert({ where: { email: "employee@diamondshine.com" }, update: { role: Role.EMPLOYEE, password }, create: { email: "employee@diamondshine.com", role: Role.EMPLOYEE, password } });
  const viewer = await prisma.user.upsert({ where: { email: "viewer@diamondshine.com" }, update: { role: Role.VIEWER, password }, create: { email: "viewer@diamondshine.com", role: Role.VIEWER, password } });

  await prisma.supplyRequest.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.notification.deleteMany();

  await prisma.supplyRequest.createMany({
    data: [
      { department: "Cleaning", item: "Gloves", notes: "Late shift usage", priority: SupplyPriority.NORMAL, quantity: 200, requesterId: employee.id, status: SupplyStatus.PENDING },
      { department: "Operations", item: "Mops", priority: SupplyPriority.URGENT, quantity: 25, requesterId: employee.id, status: SupplyStatus.EMAIL_SENT },
      { department: "Maintenance", item: "Detergent", priority: SupplyPriority.LOW, quantity: 15, requesterId: admin.id, status: SupplyStatus.COMPLETED },
    ],
  });

  await prisma.feedback.createMany({
    data: [
      { averageScore: 8.5, categoryLabel: "Excellent", comments: "Great consistency and quality.", employeeId: employee.id, reviewerId: supervisor.id, score: 9 },
      { averageScore: 8.5, categoryLabel: "Very Good", comments: "Strong performance, improve reporting detail.", employeeId: employee.id, reviewerId: admin.id, score: 8 },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { channel: "IN_APP", message: "Your request for Gloves is pending.", recipientId: employee.id, title: "Supply request submitted" },
      { channel: "IN_APP", message: "Please complete monthly employee feedback.", recipientId: supervisor.id, title: "Feedback due" },
      { channel: "IN_APP", message: "Dashboard is available in read-only mode.", recipientId: viewer.id, title: "Viewer access" },
    ],
  });

  console.log("Seed completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
