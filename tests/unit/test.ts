import { canAccess } from "@/lib/permissions"

describe("Permissions system", () => {

    test("admin can access dashboard", () => {
        expect(canAccess("ADMIN", "dashboard")).toBe(true)
    })

    test("employee cannot access dashboard", () => {
        expect(canAccess("EMPLOYEE", "dashboard")).toBe(false)
    })

    test("supervisor can access feedback", () => {
        expect(canAccess("SUPERVISOR", "feedback")).toBe(true)
    })

})