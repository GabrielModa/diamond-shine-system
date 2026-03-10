import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/src/components/forms/LoginForm";
import { authOptions } from "@/src/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
