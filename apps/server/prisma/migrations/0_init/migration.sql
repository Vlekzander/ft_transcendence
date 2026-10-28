-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "public"."GameMode" AS ENUM ('SOLO', 'DUO');

-- CreateEnum
CREATE TYPE "public"."GameStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FINISHED');

-- CreateTable
CREATE TABLE "public"."Friendship" (
    "uuid" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "status" "public"."FriendshipStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."Game" (
    "uuid" UUID NOT NULL,
    "mode" "public"."GameMode" NOT NULL DEFAULT 'SOLO',
    "status" "public"."GameStatus" NOT NULL DEFAULT 'PENDING',
    "duration" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "uuid" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "uuid" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarPath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."UserOnGame" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserOnGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Friendship_receiverId_status_idx" ON "public"."Friendship"("receiverId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_senderId_receiverId_key" ON "public"."Friendship"("senderId" ASC, "receiverId" ASC);

-- CreateIndex
CREATE INDEX "Friendship_senderId_status_idx" ON "public"."Friendship"("senderId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Friendship_uuid_idx" ON "public"."Friendship"("uuid" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username" ASC);

-- CreateIndex
CREATE INDEX "UserOnGame_gameId_idx" ON "public"."UserOnGame"("gameId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserOnGame_userId_gameId_key" ON "public"."UserOnGame"("userId" ASC, "gameId" ASC);

-- CreateIndex
CREATE INDEX "UserOnGame_userId_idx" ON "public"."UserOnGame"("userId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Friendship" ADD CONSTRAINT "Friendship_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOnGame" ADD CONSTRAINT "UserOnGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserOnGame" ADD CONSTRAINT "UserOnGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

