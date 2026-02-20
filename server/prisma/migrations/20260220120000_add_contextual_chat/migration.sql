DO $$
BEGIN
    CREATE TYPE "ChatChannelType" AS ENUM ('COURSE', 'LESSON', 'PROBLEM', 'QUIZ', 'BATTLE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'CODE', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ChatChannel" (
    "id" TEXT NOT NULL,
    "type" "ChatChannelType" NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "problemId" TEXT,
    "quizId" TEXT,
    "battleRoomId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatReadState" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChatChannel_courseId_key" ON "ChatChannel"("courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatChannel_lessonId_key" ON "ChatChannel"("lessonId");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatChannel_problemId_key" ON "ChatChannel"("problemId");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatChannel_quizId_key" ON "ChatChannel"("quizId");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatChannel_battleRoomId_key" ON "ChatChannel"("battleRoomId");
CREATE INDEX IF NOT EXISTS "ChatChannel_type_idx" ON "ChatChannel"("type");

CREATE INDEX IF NOT EXISTS "ChatMessage_channelId_createdAt_idx"
    ON "ChatMessage"("channelId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_createdAt_idx"
    ON "ChatMessage"("senderId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "ChatReadState_channelId_userId_key"
    ON "ChatReadState"("channelId", "userId");
CREATE INDEX IF NOT EXISTS "ChatReadState_userId_lastReadAt_idx"
    ON "ChatReadState"("userId", "lastReadAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatChannel_courseId_fkey'
    ) THEN
        ALTER TABLE "ChatChannel"
            ADD CONSTRAINT "ChatChannel_courseId_fkey"
            FOREIGN KEY ("courseId")
            REFERENCES "Course"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatChannel_lessonId_fkey'
    ) THEN
        ALTER TABLE "ChatChannel"
            ADD CONSTRAINT "ChatChannel_lessonId_fkey"
            FOREIGN KEY ("lessonId")
            REFERENCES "Lesson"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatChannel_problemId_fkey'
    ) THEN
        ALTER TABLE "ChatChannel"
            ADD CONSTRAINT "ChatChannel_problemId_fkey"
            FOREIGN KEY ("problemId")
            REFERENCES "Problem"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatChannel_quizId_fkey'
    ) THEN
        ALTER TABLE "ChatChannel"
            ADD CONSTRAINT "ChatChannel_quizId_fkey"
            FOREIGN KEY ("quizId")
            REFERENCES "Quiz"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatChannel_battleRoomId_fkey'
    ) THEN
        ALTER TABLE "ChatChannel"
            ADD CONSTRAINT "ChatChannel_battleRoomId_fkey"
            FOREIGN KEY ("battleRoomId")
            REFERENCES "BattleRoom"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatChannel_createdById_fkey'
    ) THEN
        ALTER TABLE "ChatChannel"
            ADD CONSTRAINT "ChatChannel_createdById_fkey"
            FOREIGN KEY ("createdById")
            REFERENCES "User"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_channelId_fkey'
    ) THEN
        ALTER TABLE "ChatMessage"
            ADD CONSTRAINT "ChatMessage_channelId_fkey"
            FOREIGN KEY ("channelId")
            REFERENCES "ChatChannel"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatMessage_senderId_fkey'
    ) THEN
        ALTER TABLE "ChatMessage"
            ADD CONSTRAINT "ChatMessage_senderId_fkey"
            FOREIGN KEY ("senderId")
            REFERENCES "User"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatReadState_channelId_fkey'
    ) THEN
        ALTER TABLE "ChatReadState"
            ADD CONSTRAINT "ChatReadState_channelId_fkey"
            FOREIGN KEY ("channelId")
            REFERENCES "ChatChannel"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatReadState_userId_fkey'
    ) THEN
        ALTER TABLE "ChatReadState"
            ADD CONSTRAINT "ChatReadState_userId_fkey"
            FOREIGN KEY ("userId")
            REFERENCES "User"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ChatReadState_lastReadMessageId_fkey'
    ) THEN
        ALTER TABLE "ChatReadState"
            ADD CONSTRAINT "ChatReadState_lastReadMessageId_fkey"
            FOREIGN KEY ("lastReadMessageId")
            REFERENCES "ChatMessage"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;
