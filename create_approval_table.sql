-- SQL DDL script to create the ApprovalRequest table in the helpdesk database schema.
-- Run this script against your IT Helpdesk database.

CREATE TABLE IF NOT EXISTS helpdesk."ApprovalRequest" (
  id SERIAL PRIMARY KEY,
  "assetId" INTEGER NOT NULL REFERENCES helpdesk."Asset"(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES helpdesk."User"(id) ON DELETE CASCADE,
  "companyId" INTEGER REFERENCES helpdesk."Company"(id) ON DELETE SET NULL,
  "companyMasterId" INTEGER REFERENCES helpdesk."CompanyMaster"(id) ON DELETE SET NULL,
  "status" VARCHAR(20) DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
