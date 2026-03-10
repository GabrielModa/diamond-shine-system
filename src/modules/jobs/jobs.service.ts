import type { UserRole } from "../../types/user";
import type { Job, ScheduleJobInput, UpdateJobStatusInput } from "./jobs.types";

type JobRecord = Job;

type JobsDeps = {
  job: {
    create: (args: { data: { key: string; payload?: Record<string, unknown>; runAt: Date; status: "SCHEDULED" } }) => Promise<JobRecord>;
    update: (args: { where: { id: string }; data: { status: JobRecord["status"] } }) => Promise<JobRecord>;
    findMany: (args: { orderBy: { createdAt: "desc" }; take: number }) => Promise<JobRecord[]>;
  };
};

function assertCanManageJobs(role: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Only admins can schedule background jobs.");
  }
}

export function createJobsService(deps: JobsDeps) {
  return {
    async scheduleJob(input: ScheduleJobInput): Promise<Job> {
      assertCanManageJobs(input.actorRole);

      return deps.job.create({
        data: {
          key: input.key,
          payload: input.payload,
          runAt: input.runAt,
          status: "SCHEDULED",
        },
      });
    },

    async listJobs(): Promise<Job[]> {
      return deps.job.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },

    async updateStatus(input: UpdateJobStatusInput): Promise<Job> {
      return deps.job.update({
        data: {
          status: input.status,
        },
        where: {
          id: input.jobId,
        },
      });
    },
  };
}

export function createJobsServiceFromPrisma(prisma: JobsDeps) {
  return createJobsService(prisma);
}
