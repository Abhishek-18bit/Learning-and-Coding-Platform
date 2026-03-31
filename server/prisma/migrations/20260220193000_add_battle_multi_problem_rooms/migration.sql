CREATE TABLE IF NOT EXISTS "BattleRoomProblem" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattleRoomProblem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BattleRoomProblem_roomId_problemId_key"
    ON "BattleRoomProblem"("roomId", "problemId");
CREATE UNIQUE INDEX IF NOT EXISTS "BattleRoomProblem_roomId_order_key"
    ON "BattleRoomProblem"("roomId", "order");
CREATE INDEX IF NOT EXISTS "BattleRoomProblem_roomId_order_idx"
    ON "BattleRoomProblem"("roomId", "order");
CREATE INDEX IF NOT EXISTS "BattleRoomProblem_problemId_idx"
    ON "BattleRoomProblem"("problemId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BattleRoomProblem_roomId_fkey'
    ) THEN
        ALTER TABLE "BattleRoomProblem"
            ADD CONSTRAINT "BattleRoomProblem_roomId_fkey"
            FOREIGN KEY ("roomId")
            REFERENCES "BattleRoom"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BattleRoomProblem_problemId_fkey'
    ) THEN
        ALTER TABLE "BattleRoomProblem"
            ADD CONSTRAINT "BattleRoomProblem_problemId_fkey"
            FOREIGN KEY ("problemId")
            REFERENCES "Problem"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

ALTER TABLE "BattleSubmission"
    ADD COLUMN IF NOT EXISTS "problemId" TEXT;

UPDATE "BattleSubmission" AS bs
SET "problemId" = br."problemId"
FROM "BattleRoom" AS br
WHERE bs."roomId" = br."id"
  AND bs."problemId" IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "BattleSubmission"
        WHERE "problemId" IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot backfill BattleSubmission.problemId because some room references are missing';
    END IF;
END $$;

ALTER TABLE "BattleSubmission"
    ALTER COLUMN "problemId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "BattleSubmission_problemId_idx"
    ON "BattleSubmission"("problemId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BattleSubmission_problemId_fkey'
    ) THEN
        ALTER TABLE "BattleSubmission"
            ADD CONSTRAINT "BattleSubmission_problemId_fkey"
            FOREIGN KEY ("problemId")
            REFERENCES "Problem"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

INSERT INTO "BattleRoomProblem" ("id", "roomId", "problemId", "order", "createdAt")
SELECT CONCAT(br."id", ':primary'), br."id", br."problemId", 1, br."createdAt"
FROM "BattleRoom" AS br
WHERE NOT EXISTS (
    SELECT 1
    FROM "BattleRoomProblem" AS rp
    WHERE rp."roomId" = br."id"
)
ON CONFLICT ("roomId", "problemId") DO NOTHING;
