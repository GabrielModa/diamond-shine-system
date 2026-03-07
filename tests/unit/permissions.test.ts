import { canAccess } from "../../src/lib/permissions";

describe("Permissions system", () => {
  it("admin can access dashboard", () => {
    expect(canAccess("ADMIN", "dashboard")).toBe(true);
  });

  it("employee cannot access dashboard", () => {
    expect(canAccess("EMPLOYEE", "dashboard")).toBe(false);
  });

  it("supervisor can access feedback", () => {
    expect(canAccess("SUPERVISOR", "feedback")).toBe(true);
  });
});
