import type { UserRole } from "../../types/user";
import type { GenerateReportInput, Report } from "./reports.types";

type ReportRecord = Report;

type ReportsDeps = {
  report: {
    create: (args: { data: { reportKey: string; format: Report["format"]; requestedBy: string; status: "PENDING"; filters?: Record<string, string | number | boolean> } }) => Promise<ReportRecord>;
    findMany: (args: { orderBy: { createdAt: "desc" }; take: number }) => Promise<ReportRecord[]>;
  };
};

function assertCanGenerateReports(role: UserRole) {
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    throw new Error("Only admins and supervisors can generate reports.");
  }
}

export function createReportsService(deps: ReportsDeps) {
  return {
    async listReports(): Promise<Report[]> {
      return deps.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    },

    async generateReport(input: GenerateReportInput): Promise<Report> {
      assertCanGenerateReports(input.actorRole);

      return deps.report.create({
        data: {
          filters: input.filters,
          format: input.format,
          reportKey: input.reportKey,
          requestedBy: input.actorId,
          status: "PENDING",
        },
      });
    },
  };
}

export function createReportsServiceFromPrisma(prisma: ReportsDeps) {
  return createReportsService(prisma);
}
