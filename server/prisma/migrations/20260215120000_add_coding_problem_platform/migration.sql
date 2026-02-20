-- 1) Update submission status enum values.
BEGIN;
CREATE TYPE "SubmissionStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'WRONG_ANSWER', 'ERROR');
ALTER TABLE "Submission"
ALTER COLUMN "status" TYPE "SubmissionStatus_new"
USING (
    CASE
        WHEN "status"::text = 'REJECTED' THEN 'WRONG_ANSWER'
        ELSE "status"::text
    END::"SubmissionStatus_new"
);
ALTER TYPE "SubmissionStatus" RENAME TO "SubmissionStatus_old";
ALTER TYPE "SubmissionStatus_new" RENAME TO "SubmissionStatus";
DROP TYPE "public"."SubmissionStatus_old";
COMMIT;

-- 2) Drop old foreign keys before column reshaping.
ALTER TABLE "Problem" DROP CONSTRAINT IF EXISTS "Problem_lessonId_fkey";
ALTER TABLE "Submission" DROP CONSTRAINT IF EXISTS "Submission_userId_fkey";

-- 3) Submission reshape: userId -> studentId and add executionTime.
ALTER TABLE "Submission"
ADD COLUMN IF NOT EXISTS "executionTime" INTEGER,
ADD COLUMN IF NOT EXISTS "studentId" TEXT;

UPDATE "Submission"
SET "studentId" = COALESCE("studentId", "userId");

ALTER TABLE "Submission"
ALTER COLUMN "studentId" SET NOT NULL;

ALTER TABLE "Submission" DROP COLUMN IF EXISTS "userId";

-- 4) Problem reshape: add execution metadata and ownership fields.
ALTER TABLE "Problem"
ADD COLUMN IF NOT EXISTS "constraints" TEXT,
ADD COLUMN IF NOT EXISTS "createdById" TEXT,
ADD COLUMN IF NOT EXISTS "inputFormat" TEXT,
ADD COLUMN IF NOT EXISTS "outputFormat" TEXT,
ADD COLUMN IF NOT EXISTS "starterCode" TEXT;

UPDATE "Problem"
SET
    "description" = COALESCE(NULLIF(TRIM("description"), ''), 'No description provided'),
    "inputFormat" = COALESCE("inputFormat", 'Read from standard input'),
    "outputFormat" = COALESCE("outputFormat", 'Write result to standard output'),
    "constraints" = COALESCE("constraints", 'Refer to problem statement'),
    "starterCode" = COALESCE("starterCode", 'function solve(input) { return input; }');

UPDATE "Problem" p
SET "createdById" = c."teacherId"
FROM "Lesson" l
JOIN "Course" c ON c."id" = l."courseId"
WHERE p."lessonId" = l."id"
  AND p."createdById" IS NULL;

UPDATE "Problem"
SET "createdById" = (
    SELECT "id"
    FROM "User"
    ORDER BY "createdAt" ASC
    LIMIT 1
)
WHERE "createdById" IS NULL;

ALTER TABLE "Problem"
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "inputFormat" SET NOT NULL,
ALTER COLUMN "outputFormat" SET NOT NULL,
ALTER COLUMN "constraints" SET NOT NULL,
ALTER COLUMN "starterCode" SET NOT NULL,
ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- 5) Create TestCase table.
CREATE TABLE IF NOT EXISTS "TestCase" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- 6) Migrate legacy JSON test cases into TestCase rows.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Problem'
          AND column_name = 'testCases'
    ) THEN
        EXECUTE $sql$
            INSERT INTO "TestCase" ("id", "problemId", "input", "expectedOutput", "isHidden")
            SELECT
                md5(random()::text || clock_timestamp()::text || p."id" || tc.ordinality::text),
                p."id",
                COALESCE(tc.item->>'input', ''),
                COALESCE(tc.item->>'expectedOutput', tc.item->>'output', tc.item->>'expected', ''),
                true
            FROM "Problem" p
            CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p."testCases"::jsonb, '[]'::jsonb)) WITH ORDINALITY AS tc(item, ordinality)
            WHERE jsonb_typeof(COALESCE(p."testCases"::jsonb, '[]'::jsonb)) = 'array'
        $sql$;
    END IF;
END $$;

ALTER TABLE "Problem" DROP COLUMN IF EXISTS "testCases";

-- 7) Create ProblemProgress table.
CREATE TABLE IF NOT EXISTS "ProblemProgress" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isSolved" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" TIMESTAMP(3),
    CONSTRAINT "ProblemProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProblemProgress_problemId_studentId_key" ON "ProblemProgress"("problemId", "studentId");

-- 8) Add final foreign keys.
ALTER TABLE "Problem"
ADD CONSTRAINT "Problem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Problem"
ADD CONSTRAINT "Problem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Submission"
ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TestCase"
ADD CONSTRAINT "TestCase_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProblemProgress"
ADD CONSTRAINT "ProblemProgress_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProblemProgress"
ADD CONSTRAINT "ProblemProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
