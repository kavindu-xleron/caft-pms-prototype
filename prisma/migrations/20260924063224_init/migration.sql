-- CreateEnum
CREATE TYPE "Result" AS ENUM ('COMPETENT', 'NOT_YET_COMPETENT');

-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "pilots" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "pilotId" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "validUntil" DATE NOT NULL,
    "flyingHours" DECIMAL(7,1) NOT NULL,
    "authorizedModels" TEXT[],
    "competencies" TEXT[],
    "result" "Result" NOT NULL DEFAULT 'COMPETENT',
    "trainingManager" TEXT NOT NULL,
    "authorizedSignatory" TEXT NOT NULL,
    "status" "CertStatus" NOT NULL DEFAULT 'ACTIVE',
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "issuedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_sequences" (
    "year" INTEGER NOT NULL,
    "lastNo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "certificate_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pilots_employeeId_key" ON "pilots"("employeeId");

-- CreateIndex
CREATE INDEX "pilots_fullName_idx" ON "pilots"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNo_key" ON "certificates"("certificateNo");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_publicToken_key" ON "certificates"("publicToken");

-- CreateIndex
CREATE INDEX "certificates_pilotId_idx" ON "certificates"("pilotId");

-- CreateIndex
CREATE INDEX "certificates_validUntil_idx" ON "certificates"("validUntil");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
