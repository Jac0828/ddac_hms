-- ============================================
-- Migration 004: Add Featured Offers to Hotel Settings
-- ============================================

-- Add FeaturedOffersJson column to HotelSettings table
ALTER TABLE "HotelSettings" ADD COLUMN IF NOT EXISTS "FeaturedOffersJson" jsonb DEFAULT '[]';





