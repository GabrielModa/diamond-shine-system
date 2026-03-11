type SupplyRequestEmailPayload = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  priority: "LOW" | "NORMAL" | "URGENT";
  notes?: string | null;
};

type FeedbackEmailPayload = {
  employeeId: string;
  score: number;
  categoryLabel: string;
  comments: string;
};

type SendMailOptions = {
  from?: string;
  html: string;
  subject: string;
  to: string;
};

type MailTransporter = {
  sendMail: (options: SendMailOptions) => Promise<unknown>;
};

type MailerModule = {
  createTestAccount: () => Promise<{
    pass: string;
    smtp: { host: string; port: number; secure: boolean };
    user: string;
  }>;
  createTransport: (config: Record<string, unknown>) => MailTransporter;
};

let cachedTransporter: MailTransporter | null = null;
let cachedMailer: MailerModule | null = null;

async function getMailer(): Promise<MailerModule | null> {
  if (cachedMailer) {
    return cachedMailer;
  }

  try {
    const module = await import("nodemailer");
    cachedMailer = (module.default ?? module) as MailerModule;
    return cachedMailer;
  } catch {
    return null;
  }
}

async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const mailer = await getMailer();
  if (!mailer) {
    return null;
  }

  if (process.env.SMTP_HOST) {
    cachedTransporter = mailer.createTransport({
      auth: process.env.SMTP_USER
        ? { pass: process.env.SMTP_PASS ?? "", user: process.env.SMTP_USER }
        : undefined,
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
    });
    return cachedTransporter;
  }

  const testAccount = await mailer.createTestAccount();
  cachedTransporter = mailer.createTransport({
    auth: {
      pass: testAccount.pass,
      user: testAccount.user,
    },
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
  });

  return cachedTransporter;
}

async function sendEmail(options: SendMailOptions) {
  const transporter = await getTransporter();
  if (!transporter) {
    console.log("[EMAIL] nodemailer unavailable, skipping email dispatch");
    return null;
  }

  const from = process.env.SMTP_FROM ?? "no-reply@diamondshine.local";
  return transporter.sendMail({
    from,
    ...options,
  });
}

export async function sendSupplyEmail(request: SupplyRequestEmailPayload) {
  const to = process.env.SUPPLY_ADMIN_EMAIL;
  if (!to) {
    return null;
  }

  return sendEmail({
    html: `<p>New supply request created.</p><p><strong>Item:</strong> ${request.item}</p><p><strong>Quantity:</strong> ${request.quantity}</p><p><strong>Department:</strong> ${request.department}</p><p><strong>Priority:</strong> ${request.priority}</p><p><strong>Notes:</strong> ${request.notes ?? "-"}</p>`,
    subject: `Supply request #${request.id} - ${request.item}`,
    to,
  });
}

export async function sendFeedbackEmail(feedback: FeedbackEmailPayload) {
  const to = process.env.FEEDBACK_REVIEWER_EMAIL;
  if (!to) {
    return null;
  }

  return sendEmail({
    html: `<p>Feedback registered.</p><p>Employee: ${feedback.employeeId}</p><p>Score: ${feedback.score}</p><p>Category: ${feedback.categoryLabel}</p><p>Comments: ${feedback.comments}</p>`,
    subject: `Feedback received - ${feedback.categoryLabel}`,
    to,
  });
}

export async function sendClientNotification(request: SupplyRequestEmailPayload, clientEmail: string) {
  return sendEmail({
    html: `<p>Your request for <strong>${request.item}</strong> is ready.</p><p>Quantity: ${request.quantity}</p><p>Department: ${request.department}</p>`,
    subject: `Update on supply request #${request.id}`,
    to: clientEmail,
  });
}
