import { createFilesService } from "../../src/modules/files/files.service";

describe("Files service", () => {
  function createDeps() {
    return {
      file: {
        create: vi.fn(),
      },
    };
  }

  it("registers uploads for employee", async () => {
    const deps = createDeps();
    const service = createFilesService(deps as never);

    deps.file.create.mockResolvedValue({
      id: "f-1",
      filename: "invoice.pdf",
      mimeType: "application/pdf",
      sizeBytes: 200,
      uploadedBy: "u-1",
      createdAt: new Date(),
    });

    const result = await service.registerUpload({
      actorId: "u-1",
      actorRole: "EMPLOYEE",
      filename: "invoice.pdf",
      mimeType: "application/pdf",
      sizeBytes: 200,
    });

    expect(result.filename).toBe("invoice.pdf");
  });

  it("blocks upload for viewer", async () => {
    const service = createFilesService(createDeps() as never);

    await expect(
      service.registerUpload({
        actorId: "u-4",
        actorRole: "VIEWER",
        filename: "invoice.pdf",
        mimeType: "application/pdf",
        sizeBytes: 200,
      }),
    ).rejects.toThrow("Viewers cannot upload files.");
  });
});
