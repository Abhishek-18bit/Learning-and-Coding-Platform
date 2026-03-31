-- Create unit hierarchy for courses
CREATE TABLE "CourseUnit" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseTopic" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "lessonId" TEXT,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseTopic_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lesson"
ADD COLUMN IF NOT EXISTS "unitId" TEXT;

CREATE UNIQUE INDEX "CourseTopic_lessonId_key" ON "CourseTopic"("lessonId");
CREATE INDEX "CourseUnit_courseId_sortOrder_idx" ON "CourseUnit"("courseId", "sortOrder");
CREATE INDEX "CourseTopic_unitId_sortOrder_idx" ON "CourseTopic"("unitId", "sortOrder");
CREATE INDEX "Lesson_courseId_unitId_createdAt_idx" ON "Lesson"("courseId", "unitId", "createdAt");

ALTER TABLE "CourseUnit"
ADD CONSTRAINT "CourseUnit_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseTopic"
ADD CONSTRAINT "CourseTopic_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "CourseUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseTopic"
ADD CONSTRAINT "CourseTopic_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lesson"
ADD CONSTRAINT "Lesson_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "CourseUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
