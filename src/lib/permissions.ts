export const permissions = {
    ADMIN: ["supplies", "feedback", "dashboard"],
    SUPERVISOR: ["supplies", "feedback"],
    EMPLOYEE: ["supplies"],
    VIEWER: []
}

export function canAccess(role: string, page: string) {
    return permissions[role]?.includes(page) ?? false
}