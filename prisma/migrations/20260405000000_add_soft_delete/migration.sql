-- AlterTable
ALTER TABLE "pets" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "adoption_listings" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lost_found_reports" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "service_listings" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "pets_deleted_at_idx" ON "pets"("deleted_at");

-- CreateIndex
CREATE INDEX "adoption_listings_deleted_at_idx" ON "adoption_listings"("deleted_at");

-- CreateIndex
CREATE INDEX "lost_found_reports_deleted_at_idx" ON "lost_found_reports"("deleted_at");

-- CreateIndex
CREATE INDEX "service_listings_deleted_at_idx" ON "service_listings"("deleted_at");
