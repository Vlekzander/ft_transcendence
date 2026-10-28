-- CreateTable
CREATE TABLE "UserStats" (
    "userId" UUID NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "correctGuesses" INTEGER NOT NULL DEFAULT 0,
    "firstGuessStreak" INTEGER NOT NULL DEFAULT 0,
    "gameStreak" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
