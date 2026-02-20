DO $$
BEGIN
    CREATE TYPE "QuizSourceType" AS ENUM ('MANUAL', 'LESSON_AI', 'PDF_AI');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Quiz"
    ADD COLUMN IF NOT EXISTS "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS "lessonId" TEXT,
    ADD COLUMN IF NOT EXISTS "sourceType" "QuizSourceType" NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "QuizQuestion"
    ADD COLUMN IF NOT EXISTS "explanation" TEXT;

UPDATE "QuizQuestion"
SET "explanation" = 'No explanation provided'
WHERE "explanation" IS NULL;

ALTER TABLE "QuizQuestion"
    ALTER COLUMN "explanation" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Quiz_lessonId_fkey'
    ) THEN
        ALTER TABLE "Quiz"
            ADD CONSTRAINT "Quiz_lessonId_fkey"
            FOREIGN KEY ("lessonId")
            REFERENCES "Lesson"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;
