const {
  bcryptCompareMock,
  bcryptHashMock,
  prismaMock,
  prismaAdapterMock,
} = vi.hoisted(() => ({
  bcryptCompareMock: vi.fn(),
  bcryptHashMock: vi.fn(),
  prismaAdapterMock: vi.fn(() => ({
    createUser: vi.fn(),
  })),
  prismaMock: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: prismaAdapterMock,
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: bcryptCompareMock,
    hash: bcryptHashMock,
  },
}));

import { AuthProvider } from "@prisma/client";
import { authOptions, authorizeWithCredentials } from "../../src/lib/auth";

describe("Authentication options", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects credentials login when the user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await authorizeWithCredentials({
      email: "new.user@example.com",
      password: "plain-password",
    });

    expect(bcryptHashMock).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("rejects credentials login with invalid password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      email: "user@example.com",
      id: "u1",
      password: "stored-hash",
      role: "EMPLOYEE",
      status: "ACTIVE",
    });
    bcryptCompareMock.mockResolvedValue(false);

    const result = await authorizeWithCredentials({
      email: "user@example.com",
      password: "wrong-password",
    });

    expect(bcryptCompareMock).toHaveBeenCalledWith("wrong-password", "stored-hash");
    expect(result).toBeNull();
  });

  it("rejects credentials login with empty credentials", async () => {
    const result = await authorizeWithCredentials({
      email: "  ",
      password: "",
    });

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("adds id, email and role to the session", async () => {
    const result = await authOptions.callbacks?.session?.({
      session: {
        expires: "2099-01-01T00:00:00.000Z",
        user: {
          id: "",
          email: "",
          name: null,
          role: "EMPLOYEE",
        },
      },
      token: {
        email: "member@example.com",
        id: "u1",
        role: "SUPERVISOR",
      },
      user: {
        email: "member@example.com",
        emailVerified: null,
        id: "u1",
        role: "SUPERVISOR",
      },
    });

    expect(result?.user).toMatchObject({
      email: "member@example.com",
      id: "u1",
      role: "SUPERVISOR",
    });
  });

  it("updates provider to GOOGLE when user signs in with Google", async () => {
    const signInResult = await authOptions.callbacks?.signIn?.({
      account: {
        provider: "google",
        providerAccountId: "google-user",
        type: "oauth",
      },
      credentials: undefined,
      email: undefined,
      profile: undefined,
      user: {
        email: "google.user@example.com",
        emailVerified: null,
        id: "u2",
        role: "EMPLOYEE",
      },
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      data: {
        provider: AuthProvider.GOOGLE,
      },
      where: {
        id: "u2",
      },
    });
    expect(signInResult).toBe(true);
  });
});
