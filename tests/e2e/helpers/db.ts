import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CreateUserInput = {
  email: string;
  password: string;
  role?: "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER";
  status?: "ACTIVE" | "INACTIVE";
  name?: string;
};

export async function resetDatabase() {
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.supplyRequest.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

export async function createUser(input: CreateUserInput) {
  const hashedPassword = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? null,
      password: hashedPassword,
      provider: "LOCAL",
      role: input.role ?? "EMPLOYEE",
      status: input.status ?? "ACTIVE",
    },
    select: {
      email: true,
      id: true,
      role: true,
      status: true,
    },
  });
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
