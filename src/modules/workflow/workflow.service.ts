import type { UserRole } from "../../types/user";
import type {
  CreateWorkflowInstanceInput,
  TransitionWorkflowStepInput,
  WorkflowInstance,
} from "./workflow.types";

type WorkflowInstanceRecord = {
  id: string;
  entityId: string;
  currentStep: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  definitionName: string;
  updatedAt: Date;
};

type WorkflowDeps = {
  workflowInstance: {
    findMany: (args: { where?: { entityId?: string }; orderBy: { updatedAt: "desc" }; take: number }) => Promise<WorkflowInstanceRecord[]>;
    create: (args: {
      data: {
        entityId: string;
        currentStep: string;
        definitionName: string;
        definitionVersion: number;
        status: "PENDING";
      };
    }) => Promise<WorkflowInstanceRecord>;
    update: (args: {
      where: { id: string };
      data: {
        currentStep: string;
        status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
      };
    }) => Promise<WorkflowInstanceRecord>;
  };
};

function assertCanManageWorkflows(role: UserRole) {
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    throw new Error("Only admins and supervisors can manage workflows.");
  }
}

function toWorkflowInstance(record: WorkflowInstanceRecord): WorkflowInstance {
  return {
    currentStep: record.currentStep,
    definitionName: record.definitionName,
    entityId: record.entityId,
    id: record.id,
    status: record.status,
    updatedAt: record.updatedAt,
  };
}

export function createWorkflowService(deps: WorkflowDeps) {
  return {
    async createInstance(input: CreateWorkflowInstanceInput) {
      assertCanManageWorkflows(input.actorRole);

      const firstStep = input.definition.steps[0];
      if (!firstStep) {
        throw new Error("Workflow definitions must contain at least one step.");
      }

      const created = await deps.workflowInstance.create({
        data: {
          currentStep: firstStep,
          definitionName: input.definition.name,
          definitionVersion: input.definition.version,
          entityId: input.entityId,
          status: "PENDING",
        },
      });

      return toWorkflowInstance(created);
    },

    async listInstances(entityId?: string) {
      const rows = await deps.workflowInstance.findMany({
        orderBy: { updatedAt: "desc" },
        take: 50,
        where: entityId ? { entityId } : undefined,
      });

      return rows.map(toWorkflowInstance);
    },

    async transitionStep(input: TransitionWorkflowStepInput) {
      assertCanManageWorkflows(input.actorRole);

      const updated = await deps.workflowInstance.update({
        data: {
          currentStep: input.nextStep,
          status: input.status,
        },
        where: {
          id: input.instanceId,
        },
      });

      return toWorkflowInstance(updated);
    },
  };
}

export function createWorkflowServiceFromPrisma(prisma: WorkflowDeps) {
  return createWorkflowService(prisma);
}
