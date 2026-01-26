-- Migration: Add free_used_wealth column to device_usage
-- Run this in Supabase SQL Editor if the table already exists

ALTER TABLE device_usage ADD COLUMN IF NOT EXISTS free_used_wealth INTEGER DEFAULT 0;
