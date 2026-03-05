-- Migration 1 of 2: Add new enum values
-- These must be committed before they can be referenced in policies.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'school_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'global_admin';
