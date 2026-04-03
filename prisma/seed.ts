import "dotenv/config";
import { PrismaClient, Role, MaterialType, AssessmentType, QuestionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────
// CAPS CURRICULUM DATA
// ─────────────────────────────────────────────

const CAPS_CURRICULUM: Record<
  string,
  Record<string, Record<number, string[]>>
> = {
  Mathematics: {
    "Grade 8": {
      1: ["Whole Numbers", "Integers", "Exponents", "Numeric & Geometric Patterns"],
      2: ["Functions & Relationships", "Algebraic Expressions", "Algebraic Equations"],
      3: ["Construction of Geometric Figures", "Geometry of 2D Shapes", "Geometry of Straight Lines"],
      4: ["Transformation Geometry", "Perimeter & Area", "Surface Area & Volume", "Data Handling", "Probability"],
    },
    "Grade 9": {
      1: ["Whole Numbers", "Integers", "Exponents", "Numeric & Geometric Patterns"],
      2: ["Functions & Relationships", "Algebraic Expressions", "Algebraic Equations", "Graphs"],
      3: ["Construction of Geometric Figures", "Geometry of 2D Shapes", "Geometry of Straight Lines", "Pythagoras' Theorem"],
      4: ["Transformation Geometry", "Perimeter & Area", "Surface Area & Volume", "Data Handling", "Probability"],
    },
    "Grade 10": {
      1: ["Algebraic Expressions", "Exponents", "Number Patterns"],
      2: ["Functions & Graphs", "Euclidean Geometry"],
      3: ["Finance & Growth", "Statistics", "Trigonometry"],
      4: ["Measurement", "Probability", "Revision"],
    },
    "Grade 11": {
      1: ["Exponents & Surds", "Equations & Inequalities", "Number Patterns"],
      2: ["Functions", "Analytical Geometry"],
      3: ["Finance, Growth & Decay", "Statistics", "Trigonometry"],
      4: ["Measurement", "Probability", "Revision"],
    },
    "Grade 12": {
      1: ["Patterns, Sequences & Series", "Functions", "Finance"],
      2: ["Trigonometry", "Polynomials", "Differential Calculus"],
      3: ["Analytical Geometry", "Statistics", "Counting & Probability"],
      4: ["Integration (intro)", "Revision", "Exam Preparation"],
    },
  },
  "Physical Sciences": {
    "Grade 8": {
      1: ["Matter & Materials: Atoms & Elements", "Physical & Chemical Change"],
      2: ["Energy & Change: Energy Transfers", "Waves, Sound & Light"],
      3: ["Visible Earth: Plate Tectonics", "Hydrosphere"],
      4: ["Chemical Industries", "Revision"],
    },
    "Grade 9": {
      1: ["Matter & Materials: Ionic & Covalent Bonding", "Chemical Change"],
      2: ["Energy & Change: Electricity", "Electromagnetic Radiation"],
      3: ["Mechanics: Motion"],
      4: ["Chemical Industries", "Revision"],
    },
    "Grade 10": {
      1: ["Mechanics: Vectors, Motion & Force", "Matter & Materials: Atomic Structure"],
      2: ["Waves, Sound & Light: Transverse & Longitudinal Waves", "Chemical Bonding & Molecular Structure"],
      3: ["Electricity & Magnetism: Electric Circuits", "Chemical Reactions: Stoichiometry"],
      4: ["Quantitative Aspects of Chemical Change", "Revision"],
    },
    "Grade 11": {
      1: ["Mechanics: Newton's Laws", "Momentum & Impulse", "Matter: Intermolecular Forces"],
      2: ["Waves, Sound & Light: Doppler Effect", "Acid-Base & Redox Reactions"],
      3: ["Electricity & Magnetism: Electrostatics, Circuits", "Chemical Equilibrium"],
      4: ["Electrochemical Reactions", "Revision"],
    },
    "Grade 12": {
      1: ["Mechanics: Momentum, Work, Energy & Power", "Vertical Projectile Motion"],
      2: ["Matter & Materials: Organic Chemistry", "Optical Phenomena"],
      3: ["Electricity & Magnetism: Electric Circuits", "Chemical Equilibrium & Rates"],
      4: ["Electrochemistry", "Nuclear Reactions", "Revision"],
    },
  },
};

async function main() {
  console.log("🌱 Starting database seed...");

  // ─────────────────────────────────────────────
  // CLEAN EXISTING DATA
  // ─────────────────────────────────────────────
  await prisma.systemLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.learningMaterial.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.tutorAssignment.deleteMany();
  await prisma.capsTopic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // ─────────────────────────────────────────────
  // ACADEMIC YEAR
  // ─────────────────────────────────────────────
  await prisma.academicYear.create({
    data: {
      year: 2025,
      isCurrent: true,
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-11-30"),
    },
  });

  // ─────────────────────────────────────────────
  // GRADES
  // ─────────────────────────────────────────────
  const gradeLabels = ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  const grades: Record<string, { id: string; label: string }> = {};

  for (let i = 0; i < gradeLabels.length; i++) {
    const grade = await prisma.grade.create({
      data: { label: gradeLabels[i], order: i + 1 },
    });
    grades[gradeLabels[i]] = grade;
  }
  console.log("✅ Created grades");

  // ─────────────────────────────────────────────
  // SUBJECTS & CAPS TOPICS
  // ─────────────────────────────────────────────
  const subjectNames = ["Mathematics", "Physical Sciences"];
  const subjects: Record<string, { id: string }> = {};

  for (const subjectName of subjectNames) {
    for (const gradeLabel of gradeLabels) {
      const grade = grades[gradeLabel];
      const subject = await prisma.subject.create({
        data: { name: subjectName, gradeId: grade.id },
      });
      subjects[`${subjectName}-${gradeLabel}`] = subject;

      // Seed CAPS topics
      const termMap = CAPS_CURRICULUM[subjectName][gradeLabel];
      for (const [termStr, topics] of Object.entries(termMap)) {
        const term = parseInt(termStr);
        for (let i = 0; i < topics.length; i++) {
          await prisma.capsTopic.create({
            data: {
              title: topics[i],
              term,
              subjectId: subject.id,
              gradeId: grade.id,
              order: i + 1,
            },
          });
        }
      }
    }
  }
  console.log("✅ Created subjects and CAPS topics");

  // ─────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────
  const password = await bcrypt.hash("Password@123", 12);

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@mathe-matise.co.za",
      hashedPassword: password,
      role: Role.ADMIN,
    },
  });

  // Tutors
  const tutorMaths = await prisma.user.create({
    data: {
      name: "Thabo Nkosi",
      email: "thabo.nkosi@mathe-matise.co.za",
      hashedPassword: password,
      role: Role.TUTOR,
    },
  });

  const tutorScience = await prisma.user.create({
    data: {
      name: "Lerato Dlamini",
      email: "lerato.dlamini@mathe-matise.co.za",
      hashedPassword: password,
      role: Role.TUTOR,
    },
  });

  // Learners (one per grade 8–12)
  const learnerData = [
    { name: "Sipho Mokoena", email: "sipho.mokoena@learner.mathe-matise.co.za", grade: "Grade 8" },
    { name: "Ayanda Zulu", email: "ayanda.zulu@learner.mathe-matise.co.za", grade: "Grade 9" },
    { name: "Nomvula Khumalo", email: "nomvula.khumalo@learner.mathe-matise.co.za", grade: "Grade 10" },
    { name: "Bongani Sithole", email: "bongani.sithole@learner.mathe-matise.co.za", grade: "Grade 11" },
    { name: "Zanele Mthembu", email: "zanele.mthembu@learner.mathe-matise.co.za", grade: "Grade 12" },
  ];

  const learners: { id: string; grade: string }[] = [];
  for (const ld of learnerData) {
    const learner = await prisma.user.create({
      data: {
        name: ld.name,
        email: ld.email,
        hashedPassword: password,
        role: Role.LEARNER,
      },
    });
    learners.push({ id: learner.id, grade: ld.grade });
  }

  console.log("✅ Created users");

  // ─────────────────────────────────────────────
  // TUTOR ASSIGNMENTS
  // ─────────────────────────────────────────────
  for (const gradeLabel of gradeLabels) {
    const grade = grades[gradeLabel];

    // Maths tutor → all grades, Mathematics
    const mathsSubject = subjects[`Mathematics-${gradeLabel}`];
    await prisma.tutorAssignment.create({
      data: {
        tutorId: tutorMaths.id,
        subjectId: mathsSubject.id,
        gradeId: grade.id,
      },
    });

    // Science tutor → all grades, Physical Sciences
    const scienceSubject = subjects[`Physical Sciences-${gradeLabel}`];
    await prisma.tutorAssignment.create({
      data: {
        tutorId: tutorScience.id,
        subjectId: scienceSubject.id,
        gradeId: grade.id,
      },
    });
  }

  console.log("✅ Created tutor assignments");

  // ─────────────────────────────────────────────
  // LEARNER ENROLLMENTS
  // ─────────────────────────────────────────────
  for (const learner of learners) {
    const mathsSubject = subjects[`Mathematics-${learner.grade}`];
    const scienceSubject = subjects[`Physical Sciences-${learner.grade}`];

    await prisma.enrollment.create({
      data: { learnerId: learner.id, subjectId: mathsSubject.id },
    });
    await prisma.enrollment.create({
      data: { learnerId: learner.id, subjectId: scienceSubject.id },
    });
  }

  console.log("✅ Created enrollments");

  // ─────────────────────────────────────────────
  // SAMPLE ASSESSMENTS (1 quiz per subject per grade)
  // ─────────────────────────────────────────────
  for (const gradeLabel of gradeLabels) {
    const grade = grades[gradeLabel];

    for (const subjectName of subjectNames) {
      const subject = subjects[`${subjectName}-${gradeLabel}`];
      const tutorId = subjectName === "Mathematics" ? tutorMaths.id : tutorScience.id;

      const capsTopics = await prisma.capsTopic.findMany({
        where: { subjectId: subject.id, term: 1 },
        take: 1,
      });

      const topicTitle = capsTopics[0]?.title ?? "General";

      const assessment = await prisma.assessment.create({
        data: {
          title: `${gradeLabel} ${subjectName} — Term 1 Quiz`,
          type: AssessmentType.QUIZ,
          subjectId: subject.id,
          gradeId: grade.id,
          createdBy: tutorId,
          dueDate: new Date("2025-03-31"),
          totalMarks: 10,
          isPublished: true,
        },
      });

      // MCQ questions
      await prisma.question.createMany({
        data: [
          {
            assessmentId: assessment.id,
            questionText: `Which of the following best describes the topic "${topicTitle}"?`,
            type: QuestionType.MCQ,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A",
            marks: 2,
            order: 1,
          },
          {
            assessmentId: assessment.id,
            questionText: `State one key concept from ${topicTitle}.`,
            type: QuestionType.SHORT,
            marks: 3,
            order: 2,
          },
          {
            assessmentId: assessment.id,
            questionText: `Explain the importance of ${topicTitle} in ${subjectName}.`,
            type: QuestionType.LONG,
            marks: 5,
            order: 3,
          },
        ],
      });
    }
  }

  console.log("✅ Created sample assessments");

  // ─────────────────────────────────────────────
  // WELCOME ANNOUNCEMENT
  // ─────────────────────────────────────────────
  await prisma.announcement.create({
    data: {
      title: "Welcome to Mathe-Matise!",
      content:
        "Welcome to the Mathe-Matise Learning Management System. This platform is designed to support your Mathematics and Physical Sciences journey through Grades 8–12 following the CAPS curriculum. Explore your dashboard to get started.",
      target: "ALL",
      createdBy: admin.id,
      isActive: true,
    },
  });

  console.log("✅ Created announcement");

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log("\n🎉 Seed complete! Default credentials:");
  console.log("  Admin:   admin@mathe-matise.co.za    / Password@123");
  console.log("  Tutor 1: thabo.nkosi@mathe-matise.co.za  / Password@123  (Mathematics)");
  console.log("  Tutor 2: lerato.dlamini@mathe-matise.co.za / Password@123 (Physical Sciences)");
  console.log("  Learner: sipho.mokoena@learner.mathe-matise.co.za / Password@123  (Grade 8)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
