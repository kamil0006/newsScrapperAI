-- AlterTable
ALTER TABLE "Article" ADD COLUMN "readerFetchedAt" DATETIME;
ALTER TABLE "Article" ADD COLUMN "readerKeyPoints" TEXT;
ALTER TABLE "Article" ADD COLUMN "readerLocale" TEXT;
ALTER TABLE "Article" ADD COLUMN "readerText" TEXT;
