-- ============================================
-- Migration 005: Add Email Verification Fields
-- ============================================

-- Add EmailVerificationCode column to AspNetUsers table
ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "EmailVerificationCode" text;
ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "EmailVerified" boolean DEFAULT false;





