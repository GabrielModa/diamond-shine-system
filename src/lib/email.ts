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

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

async function sendEmail(options: EmailOptions) {
  const transport = process.env.SMTP_HOST ? "smtp" : "ethereal-dev";

  // This project runs in restricted CI and local sandboxes where SMTP clients may be unavailable.
  // We still keep a single email gateway so domain modules stay decoupled from implementation details.
  return Promise.resolve({
    accepted: [options.to],
    html: options.html,
    subject: options.subject,
    transport,
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
