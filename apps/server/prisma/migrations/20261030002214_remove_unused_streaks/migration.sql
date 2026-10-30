/*
  Warnings:

  - You are about to drop the column `firstGuessStreak` on the `UserStats` table. All the data in the column will be lost.
  - You are about to drop the column `gameStreak` on the `UserStats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserStats" DROP COLUMN "firstGuessStreak",
DROP COLUMN "gameStreak";
