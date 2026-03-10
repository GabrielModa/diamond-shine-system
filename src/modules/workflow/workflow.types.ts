import type { UserRole } from "../../types/user";

export type WorkflowStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export type WorkflowDefinition = {
  name: string;
  version: number;
  steps: string[];
};

export type CreateWorkflowInstanceInput = {
  actorId: string;
  actorRole: UserRole;
  entityId: string;
  definition: WorkflowDefinition;
};

export type TransitionWorkflowStepInput = {
  actorId: string;
  actorRole: UserRole;
  instanceId: string;
  nextStep: string;
  status: WorkflowStatus;
};

export type WorkflowInstance = {
  id: string;
  entityId: string;
  currentStep: string;
  status: WorkflowStatus;
  definitionName: string;
  updatedAt: Date;
};
