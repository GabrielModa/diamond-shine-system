import { canAccessRoute, getSidebarLinks } from "../../src/lib/permissions";

describe("Permissions system", () => {
  it("admin can access dashboard", () => {
    expect(canAccessRoute("ADMIN", "/dashboard")).toBe(true);
  });

  it("employee cannot access users", () => {
    expect(canAccessRoute("EMPLOYEE", "/users")).toBe(false);
  });

  it("supervisor can access feedback", () => {
    expect(canAccessRoute("SUPERVISOR", "/feedback")).toBe(true);
  });

  it("viewer only gets the dashboard link", () => {
    expect(getSidebarLinks("VIEWER")).toEqual([{ href: "/dashboard", label: "Dashboard" }]);
  });
});
