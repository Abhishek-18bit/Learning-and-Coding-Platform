DO $$
BEGIN
    CREATE TYPE "BattleRoomStatus" AS ENUM ('WAITING', 'LIVE', 'ENDED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BattleRoom" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" "BattleRoomStatus" NOT NULL DEFAULT 'WAITING',
    "duration" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "maxParticipants" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BattleRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BattleParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "BattleParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BattleSubmission" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submissionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeTaken" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    CONSTRAINT "BattleSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BattleRoom_roomCode_key" ON "BattleRoom"("roomCode");
CREATE INDEX IF NOT EXISTS "BattleRoom_teacherId_status_idx" ON "BattleRoom"("teacherId", "status");
CREATE INDEX IF NOT EXISTS "BattleRoom_problemId_idx" ON "BattleRoom"("problemId");

CREATE UNIQUE INDEX IF NOT EXISTS "BattleParticipant_roomId_userId_key" ON "BattleParticipant"("roomId", "userId");
CREATE INDEX IF NOT EXISTS "BattleParticipant_roomId_idx" ON "BattleParticipant"("roomId");

CREATE UNIQUE INDEX IF NOT EXISTS "BattleSubmission_roomId_userId_attemptNumber_key"
    ON "BattleSubmission"("roomId", "userId", "attemptNumber");
CREATE INDEX IF NOT EXISTS "BattleSubmission_roomId_submissionTime_idx"
    ON "BattleSubmission"("roomId", "submissionTime");
CREATE INDEX IF NOT EXISTS "BattleSubmission_roomId_isCorrect_timeTaken_attemptNumber_idx"
    ON "BattleSubmission"("roomId", "isCorrect", "timeTaken", "attemptNumber");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BattleRoom_problemId_fkey'
    ) THEN
        ALTER TABLE "BattleRoom"
            ADD CONSTRAINT "BattleRoom_problemId_fkey"
            FOREIGN KEY ("problemId")
            REFERENCES "Problem"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BattleRoom_teacherId_fkey'
    ) THEN
        ALTER TABLE "BattleRoom"
            ADD CONSTRAINT "BattleRoom_teacherId_fkey"
            FOREIGN KEY ("teacherId")
            REFERENCES "User"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BattleParticipant_roomId_fkey'
    ) THEN
        ALTER TABLE "BattleParticipant"
            ADD CONSTRAINT "BattleParticipant_roomId_fkey"
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
        WHERE conname = 'BattleParticipant_userId_fkey'
    ) THEN
        ALTER TABLE "BattleParticipant"
            ADD CONSTRAINT "BattleParticipant_userId_fkey"
            FOREIGN KEY ("userId")
            REFERENCES "User"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BattleSubmission_roomId_fkey'
    ) THEN
        ALTER TABLE "BattleSubmission"
            ADD CONSTRAINT "BattleSubmission_roomId_fkey"
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
        WHERE conname = 'BattleSubmission_userId_fkey'
    ) THEN
        ALTER TABLE "BattleSubmission"
            ADD CONSTRAINT "BattleSubmission_userId_fkey"
            FOREIGN KEY ("userId")
            REFERENCES "User"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;
