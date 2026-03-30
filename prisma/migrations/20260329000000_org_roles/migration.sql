-- CreateEnum: organization member roles
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER');

-- AlterTable: add role to organization_persons
-- Existing rows (all initial responsible persons) default to OWNER
ALTER TABLE "organization_persons"
  ADD COLUMN "role" "OrgRole" NOT NULL DEFAULT 'OWNER'::"OrgRole";

-- Change column default to MEMBER for future inserts
ALTER TABLE "organization_persons"
  ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"OrgRole";
