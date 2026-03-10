const {
  bcryptCompareMock,
  bcryptHashMock,
  consoleLogMock,
  randomBytesMock,
} = vi.hoisted(() => ({
  bcryptCompareMock: vi.fn(),
  bcryptHashMock: vi.fn(),
  consoleLogMock: vi.fn(),
  randomBytesMock: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: bcryptCompareMock,
    hash: bcryptHashMock,
  },
}));

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");

  return {
    ...actual,
    randomBytes: randomBytesMock,
  };
});

import { createAuthenticationService } from "../../src/modules/auth/auth.service";

function createPrismaMock() {
  return {
    auditLog: {
      create: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };
}

describe("Authentication service", () => {
  const baseUrl = "http://localhost:3000";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(consoleLogMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a local user with a hashed password and default EMPLOYEE role", async () => {
    const prisma = createPrismaMock();
    const service = createAuthenticationService(prisma as never);

    prisma.user.findUnique.mockResolvedValue(null);
    bcryptHashMock.mockResolvedValue("hashed-password");
    prisma.user.create.mockResolvedValue({
      email: "new.user@example.com",
      id: "u1",
      name: "New User",
      role: "EMPLOYEE",
    });

    const result = await service.registerUser({
      email: "New.User@example.com",
      name: "New User",
      password: "plain-password",
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: "new.user@example.com",
      },
    });
    expect(bcryptHashMock).toHaveBeenCalledWith("plain-password", 12);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "new.user@example.com",
        name: "New User",
        password: "hashed-password",
        provider: "LOCAL",
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
      select: {
        email: true,
        id: true,
        name: true,
        role: true,
      },
    });
    expect(result).toMatchObject({
      email: "new.user@example.com",
      id: "u1",
      role: "EMPLOYEE",
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "USER_CREATED",
        actorId: "u1",
        entity: "User",
        entityId: "u1",
        metadata: {
          role: "EMPLOYEE",
        },
      },
    });
  });

  it("blocks registration when the email already exists", async () => {
    const prisma = createPrismaMock();
    const service = createAuthenticationService(prisma as never);

    prisma.user.findUnique.mockResolvedValue({
      id: "u-existing",
    });

    await expect(
      service.registerUser({
        email: "existing@example.com",
        name: "Existing",
        password: "plain-password",
      }),
    ).rejects.toThrow("An account with this email already exists.");

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a reset token, stores its hash, and logs the reset link", async () => {
    const prisma = createPrismaMock();
    const service = createAuthenticationService(prisma as never);

    prisma.user.findUnique.mockResolvedValue({
      email: "member@example.com",
      id: "u1",
    });
    randomBytesMock.mockReturnValue(Buffer.from("raw-reset-token"));

    await service.requestPasswordReset({
      baseUrl,
      email: "member@example.com",
    });

    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: {
        identifier: "password-reset:member@example.com",
      },
    });
    expect(prisma.verificationToken.create).toHaveBeenCalledTimes(1);
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining(`${baseUrl}/reset-password/`),
    );
  });

  it("rejects password reset when the token is invalid", async () => {
    const prisma = createPrismaMock();
    const service = createAuthenticationService(prisma as never);

    prisma.verificationToken.findUnique.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        password: "new-password",
        token: "missing-token",
      }),
    ).rejects.toThrow("Invalid or expired reset token.");

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("updates the password, invalidates sessions, and removes the token after reset", async () => {
    const prisma = createPrismaMock();
    const service = createAuthenticationService(prisma as never);

    const expires = new Date(Date.now() + 60_000);
    const token = "raw-token";

    prisma.verificationToken.findUnique.mockResolvedValue({
      expires,
      identifier: "password-reset:user@example.com",
      token: "hashed-token",
    });
    bcryptHashMock.mockResolvedValue("new-hashed-password");
    prisma.user.update.mockResolvedValue({
      id: "u1",
    });

    await service.resetPassword({
      password: "new-password",
      token,
    });

    expect(bcryptHashMock).toHaveBeenCalledWith("new-password", 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      data: {
        password: "new-hashed-password",
        provider: "LOCAL",
      },
      select: {
        id: true,
      },
      where: {
        email: "user@example.com",
      },
    });
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "u1",
      },
    });
    expect(prisma.verificationToken.delete).toHaveBeenCalledTimes(1);
  });
});
