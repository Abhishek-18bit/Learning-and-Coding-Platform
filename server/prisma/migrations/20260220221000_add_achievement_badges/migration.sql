CREATE TABLE IF NOT EXISTS "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BadgeDefinition_code_key"
    ON "BadgeDefinition"("code");

CREATE TABLE IF NOT EXISTS "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badgeId_key"
    ON "UserBadge"("userId", "badgeId");
CREATE INDEX IF NOT EXISTS "UserBadge_userId_earnedAt_idx"
    ON "UserBadge"("userId", "earnedAt");
CREATE INDEX IF NOT EXISTS "UserBadge_badgeId_idx"
    ON "UserBadge"("badgeId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'UserBadge_userId_fkey'
    ) THEN
        ALTER TABLE "UserBadge"
            ADD CONSTRAINT "UserBadge_userId_fkey"
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
        WHERE conname = 'UserBadge_badgeId_fkey'
    ) THEN
        ALTER TABLE "UserBadge"
            ADD CONSTRAINT "UserBadge_badgeId_fkey"
            FOREIGN KEY ("badgeId")
            REFERENCES "BadgeDefinition"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
    END IF;
END $$;
