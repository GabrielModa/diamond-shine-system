import { getStatusTone, getSupplyWorkflowState } from "../../src/components/pages/page-state.utils";

describe("page state utils", () => {
  it("maps known statuses to badge tones", () => {
    expect(getStatusTone("ACTIVE")).toBe("success");
    expect(getStatusTone("PENDING")).toBe("warning");
    expect(getStatusTone("REJECTED")).toBe("danger");
    expect(getStatusTone("UNMAPPED")).toBe("neutral");
  });

  it("maps supply status to workflow copy", () => {
    expect(getSupplyWorkflowState("PENDING")).toContain("Awaiting");
    expect(getSupplyWorkflowState("APPROVED")).toContain("waiting");
    expect(getSupplyWorkflowState("COMPLETED")).toContain("fulfilled");
    expect(getSupplyWorkflowState("REJECTED")).toContain("rejected");
  });
});
