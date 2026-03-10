import { createSettingsService } from "../../src/modules/settings/settings.service";

describe("Settings service", () => {
  function createDeps() {
    return {
      setting: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
      },
    };
  }

  it("updates settings for admin", async () => {
    const deps = createDeps();
    const service = createSettingsService(deps as never);

    deps.setting.upsert.mockResolvedValue({
      key: "notifications.email.enabled",
      value: "true",
      updatedBy: "u-admin",
      updatedAt: new Date(),
    });

    const result = await service.upsertSetting({
      actorId: "u-admin",
      actorRole: "ADMIN",
      key: "notifications.email.enabled",
      value: "true",
    });

    expect(result.value).toBe("true");
  });

  it("blocks non-admin settings updates", async () => {
    const service = createSettingsService(createDeps() as never);

    await expect(
      service.upsertSetting({
        actorId: "u-1",
        actorRole: "EMPLOYEE",
        key: "notifications.email.enabled",
        value: "true",
      }),
    ).rejects.toThrow("Only admins can update system settings.");
  });
});
