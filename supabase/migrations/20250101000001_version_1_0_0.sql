-- Migration: Version 1.0.0 Release
-- Date: 2025-07-27
-- Description: Production release with complete feature set

-- Create version tracking table
CREATE TABLE IF NOT EXISTS public.app_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  migration_hash VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current version
INSERT INTO public.app_versions (version, description) 
VALUES ('1.0.0', 'Production release with complete personal finance dashboard features')
ON CONFLICT (version) DO NOTHING;

-- Add indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON public.accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_user_default ON public.categories(user_id, is_default);

-- Add some default categories for new users
INSERT INTO public.categories (name, color, icon, is_default, user_id) VALUES
  ('Food & Dining', '#FF6B6B', 'utensils', true, (SELECT id FROM auth.users LIMIT 1)),
  ('Transportation', '#4ECDC4', 'car', true, (SELECT id FROM auth.users LIMIT 1)),
  ('Shopping', '#45B7D1', 'shopping-bag', true, (SELECT id FROM auth.users LIMIT 1)),
  ('Entertainment', '#96CEB4', 'film', true, (SELECT id FROM auth.users LIMIT 1)),
  ('Healthcare', '#FFEAA7', 'heart', true, (SELECT id FROM auth.users LIMIT 1)),
  ('Utilities', '#DDA0DD', 'zap', true, (SELECT id FROM auth.users LIMIT 1)),
  ('Salary', '#98D8C8', 'dollar-sign', true, (SELECT id FROM auth.users LIMIT 1)),
  ('Investment', '#F7DC6F', 'trending-up', true, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING; 