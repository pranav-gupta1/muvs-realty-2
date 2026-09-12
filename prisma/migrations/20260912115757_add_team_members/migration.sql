-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL DEFAULT '',
    "credentials" TEXT NOT NULL DEFAULT '[]',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'MUVS Realty',
    "tagline" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "officeHours" TEXT NOT NULL DEFAULT '',
    "reraNumber" TEXT NOT NULL DEFAULT '',
    "instagram" TEXT NOT NULL DEFAULT '',
    "facebook" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "youtube" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT '',
    "heroSubtitle" TEXT NOT NULL DEFAULT '',
    "heroImageUrl" TEXT NOT NULL DEFAULT '',
    "aboutStory" TEXT NOT NULL DEFAULT '',
    "aboutMission" TEXT NOT NULL DEFAULT '',
    "mapEmbedUrl" TEXT NOT NULL DEFAULT '',
    "statYears" INTEGER NOT NULL DEFAULT 0,
    "statProperties" INTEGER NOT NULL DEFAULT 0,
    "statCities" INTEGER NOT NULL DEFAULT 0,
    "statClients" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("aboutMission", "aboutStory", "address", "companyName", "email", "facebook", "heroImageUrl", "heroSubtitle", "heroTitle", "id", "instagram", "linkedin", "mapEmbedUrl", "officeHours", "phone", "reraNumber", "statCities", "statClients", "statProperties", "statYears", "tagline", "updatedAt", "whatsapp", "youtube") SELECT "aboutMission", "aboutStory", "address", "companyName", "email", "facebook", "heroImageUrl", "heroSubtitle", "heroTitle", "id", "instagram", "linkedin", "mapEmbedUrl", "officeHours", "phone", "reraNumber", "statCities", "statClients", "statProperties", "statYears", "tagline", "updatedAt", "whatsapp", "youtube" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_slug_key" ON "TeamMember"("slug");

-- CreateIndex
CREATE INDEX "TeamMember_isPublished_sortOrder_idx" ON "TeamMember"("isPublished", "sortOrder");

