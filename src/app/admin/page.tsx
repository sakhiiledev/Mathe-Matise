import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { AdminOverview } from "@/components/admin/overview";

export const metadata = { title: "Admin Overview" };

async function getStats() {
  const [
    totalLearners,
    totalTutors,
    totalAssessments,
    totalMaterials,
    recentLogs,
    submissions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "LEARNER", isActive: true } }),
    prisma.user.count({ where: { role: "TUTOR", isActive: true } }),
    prisma.assessment.count({ where: { isPublished: true } }),
    prisma.learningMaterial.count({ where: { isApproved: true } }),
    prisma.systemLog.findMany({ take: 5, orderBy: { timestamp: "desc" }, include: { user: { select: { name: true } } } }),
    prisma.submission.findMany({ select: { score: true, assessment: { select: { totalMarks: true } } } }),
  ]);

  const gradedSubmissions = submissions.filter((s) => s.score !== null);
  const averageScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score! / s.assessment.totalMarks) * 100, 0) /
        gradedSubmissions.length
      : 0;

  return {
    totalLearners,
    totalTutors,
    totalAssessments,
    totalMaterials,
    averageScore: Math.round(averageScore),
    totalSubmissions: submissions.length,
    recentLogs,
  };
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const stats = await getStats();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session?.user.name?.split(" ")[0]}`}
        description="Here's what's happening across the platform today."
      />
      <AdminOverview stats={stats} />
    </div>
  );
}
