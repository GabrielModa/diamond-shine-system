import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/src/components/forms/ForgotPasswordForm";
import { authOptions } from "@/src/lib/auth";

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return <ForgotPasswordForm />;
}
