-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'PROFESSOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('RECEIVED', 'ANALYZING', 'INVESTIGATING', 'SANCTIONED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Building" AS ENUM ('FACULTAD_INGENIERIA', 'FACULTAD_ADMINISTRACION', 'FACULTAD_JURISPRUDENCIA', 'BIBLIOTECA_CENTRAL', 'ESTADIO_UNIVERSITARIO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "building" "Building" NOT NULL,
    "classroom" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'RECEIVED',
    "evidenceUrl" TEXT,
    "evidenceType" TEXT,
    "aiStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "aiSeverity" TEXT,
    "aiScore" DOUBLE PRECISION,
    "suggestedSanction" TEXT,
    "analysisJson" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalSanction" TEXT,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
