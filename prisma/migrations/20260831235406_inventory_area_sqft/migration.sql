-- DropIndex
DROP INDEX "Inventory_area_idx";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN "areaSqft" REAL;

-- CreateIndex
CREATE INDEX "Inventory_areaSqft_idx" ON "Inventory"("areaSqft");
