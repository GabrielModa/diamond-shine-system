import { NextRequest } from "next/server";

const {
  authenticationServiceMock,
  createAuthenticationServiceFromPrismaMock,
  prismaMock,
} = vi.hoisted(() => {
  const service = {
    registerUser: vi.fn(),
  };

  return {
    authenticationServiceMock: service,
    createAuthenticationServiceFromPrismaMock: vi.fn(() => service),
    prismaMock: {
      user: {},
      verificationToken: {},
    },
  };
});

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/modules/auth/auth.service", () => ({
  createAuthenticationServiceFromPrisma: createAuthenticationServiceFromPrismaMock,
}));

import { POST } from "../../src/app/api/register/route";

describe("Register API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user and returns 201", async () => {
    authenticationServiceMock.registerUser.mockResolvedValue({
      email: "new.user@example.com",
      id: "u1",
      name: "New User",
      role: "EMPLOYEE",
    });

    const request = new NextRequest("http://localhost/api/register", {
      body: JSON.stringify({
        email: "new.user@example.com",
        name: "New User",
        password: "plain-password",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const response = await POST(request);

    expect(createAuthenticationServiceFromPrismaMock).toHaveBeenCalledWith({
      user: prismaMock.user,
      verificationToken: prismaMock.verificationToken,
    });
    expect(authenticationServiceMock.registerUser).toHaveBeenCalledWith({
      email: "new.user@example.com",
      name: "New User",
      password: "plain-password",
    });
    expect(response.status).toBe(201);
  });

  it("returns 400 when registration fails", async () => {
    authenticationServiceMock.registerUser.mockRejectedValue(
      new Error("An account with this email already exists."),
    );

    const request = new NextRequest("http://localhost/api/register", {
      body: JSON.stringify({
        email: "existing@example.com",
        name: "Existing",
        password: "plain-password",
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "An account with this email already exists.",
    });
  });
});
