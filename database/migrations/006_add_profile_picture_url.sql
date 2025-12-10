-- ============================================
-- Migration 006: Add ProfilePictureUrl to AspNetUsers
-- ============================================

ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "ProfilePictureUrl" text;





