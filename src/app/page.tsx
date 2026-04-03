import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const redirectMap: Record<string, string> = {
    ADMIN: "/admin",
    TUTOR: "/tutor",
    LEARNER: "/learner",
  };

  redirect(redirectMap[session.user.role] ?? "/login");
}
