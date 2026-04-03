import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { LearnerProfile } from "@/components/learner/learner-profile";

export const metadata = { title: "My Profile" };

export default async function LearnerProfilePage() {
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: {
      enrollments: {
        include: { subject: { include: { grade: true } } },
      },
    },
  });

  return (
    <div>
      <PageHeader title="My Profile" description="View and update your personal information." />
      <LearnerProfile user={user!} />
    </div>
  );
}
