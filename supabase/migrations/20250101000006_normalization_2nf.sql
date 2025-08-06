-- Migration: Normalization 2NF Implementation
-- Date: 2025-01-01
-- Description: Implement 2NF by creating lookup tables and removing partial dependencies

-- Step 1: Create lookup tables for 2NF compliance

-- Currency lookup table
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- ISO currency code (USD, EUR, etc.)
  name TEXT NOT NULL, -- Full currency name
  symbol TEXT, -- Currency symbol ($, €, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account types lookup table
CREATE TABLE IF NOT EXISTS public.account_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- checking, savings, credit, investment
  name TEXT NOT NULL, -- Full name
  description TEXT, -- Description of the account type
  icon TEXT, -- Icon name for UI
  color TEXT, -- Hex color for UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction types lookup table
CREATE TABLE IF NOT EXISTS public.transaction_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- income, expense, transfer
  name TEXT NOT NULL, -- Full name
  description TEXT, -- Description of the transaction type
  icon TEXT, -- Icon name for UI
  color TEXT, -- Hex color for UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category icons lookup table
CREATE TABLE IF NOT EXISTS public.category_icons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- Icon name
  display_name TEXT NOT NULL, -- Human readable name
  icon_class TEXT, -- CSS class or icon library reference
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert default data into lookup tables

-- Insert default currencies
INSERT INTO public.currencies (code, name, symbol) VALUES
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('CAD', 'Canadian Dollar', 'C$'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('JPY', 'Japanese Yen', '¥'),
  ('CHF', 'Swiss Franc', 'CHF'),
  ('CNY', 'Chinese Yuan', '¥')
ON CONFLICT (code) DO NOTHING;

-- Insert default account types
INSERT INTO public.account_types (code, name, description, icon, color) VALUES
  ('checking', 'Checking Account', 'Daily transaction account for regular expenses', 'credit-card', '#3B82F6'),
  ('savings', 'Savings Account', 'Account for saving money with interest', 'piggy-bank', '#10B981'),
  ('credit', 'Credit Card', 'Credit account for purchases and payments', 'credit-card', '#F59E0B'),
  ('investment', 'Investment Account', 'Account for stocks, bonds, and other investments', 'trending-up', '#8B5CF6')
ON CONFLICT (code) DO NOTHING;

-- Insert default transaction types
INSERT INTO public.transaction_types (code, name, description, icon, color) VALUES
  ('income', 'Income', 'Money received from salary, gifts, or other sources', 'arrow-down', '#10B981'),
  ('expense', 'Expense', 'Money spent on goods, services, or bills', 'arrow-up', '#EF4444'),
  ('transfer', 'Transfer', 'Money moved between accounts', 'repeat', '#6B7280')
ON CONFLICT (code) DO NOTHING;

-- Insert default category icons
INSERT INTO public.category_icons (name, display_name, icon_class) VALUES
  ('utensils', 'Food & Dining', 'fas fa-utensils'),
  ('car', 'Transportation', 'fas fa-car'),
  ('shopping-bag', 'Shopping', 'fas fa-shopping-bag'),
  ('film', 'Entertainment', 'fas fa-film'),
  ('heart', 'Healthcare', 'fas fa-heart'),
  ('zap', 'Utilities', 'fas fa-bolt'),
  ('dollar-sign', 'Salary', 'fas fa-dollar-sign'),
  ('trending-up', 'Investment', 'fas fa-chart-line'),
  ('home', 'Housing', 'fas fa-home'),
  ('graduation-cap', 'Education', 'fas fa-graduation-cap'),
  ('plane', 'Travel', 'fas fa-plane'),
  ('gift', 'Gifts', 'fas fa-gift')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Add foreign key columns to existing tables

-- Add currency_id to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES public.currencies(id) ON DELETE SET NULL;

-- Add account_type_id to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS account_type_id UUID REFERENCES public.account_types(id) ON DELETE SET NULL;

-- Add transaction_type_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transaction_type_id UUID REFERENCES public.transaction_types(id) ON DELETE SET NULL;

-- Add icon_id to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS icon_id UUID REFERENCES public.category_icons(id) ON DELETE SET NULL;

-- Step 4: Migrate existing data to use foreign keys

-- Update accounts to use currency_id
UPDATE public.accounts 
SET currency_id = (SELECT id FROM public.currencies WHERE code = accounts.currency)
WHERE currency_id IS NULL AND currency IS NOT NULL;

-- Update accounts to use account_type_id
UPDATE public.accounts 
SET account_type_id = (SELECT id FROM public.account_types WHERE code = accounts.type)
WHERE account_type_id IS NULL AND type IS NOT NULL;

-- Update transactions to use transaction_type_id
UPDATE public.transactions 
SET transaction_type_id = (SELECT id FROM public.transaction_types WHERE code = transactions.type)
WHERE transaction_type_id IS NULL AND type IS NOT NULL;

-- Update categories to use icon_id (for existing default categories)
UPDATE public.categories 
SET icon_id = (SELECT id FROM public.category_icons WHERE name = categories.icon)
WHERE icon_id IS NULL AND icon IS NOT NULL;

-- Step 5: Make foreign key columns NOT NULL where appropriate

-- Make currency_id NOT NULL for accounts (since we have default USD)
UPDATE public.accounts SET currency_id = (SELECT id FROM public.currencies WHERE code = 'USD') WHERE currency_id IS NULL;
ALTER TABLE public.accounts ALTER COLUMN currency_id SET NOT NULL;

-- Make account_type_id NOT NULL for accounts
UPDATE public.accounts SET account_type_id = (SELECT id FROM public.account_types WHERE code = 'checking') WHERE account_type_id IS NULL;
ALTER TABLE public.accounts ALTER COLUMN account_type_id SET NOT NULL;

-- Make transaction_type_id NOT NULL for transactions
UPDATE public.transactions SET transaction_type_id = (SELECT id FROM public.transaction_types WHERE code = 'expense') WHERE transaction_type_id IS NULL;
ALTER TABLE public.transactions ALTER COLUMN transaction_type_id SET NOT NULL;

-- Step 6: Drop old columns (after ensuring data migration)

-- Drop old columns from accounts
ALTER TABLE public.accounts DROP COLUMN IF EXISTS currency;
ALTER TABLE public.accounts DROP COLUMN IF EXISTS type;

-- Drop old columns from transactions
ALTER TABLE public.transactions DROP COLUMN IF EXISTS type;

-- Drop old columns from categories (keep color for now as it might be user-specific)
-- ALTER TABLE public.categories DROP COLUMN IF EXISTS icon;

-- Step 7: Create indexes for better performance

CREATE INDEX IF NOT EXISTS idx_accounts_currency_id ON public.accounts(currency_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type_id ON public.accounts(account_type_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type_id ON public.transactions(transaction_type_id);
CREATE INDEX IF NOT EXISTS idx_categories_icon_id ON public.categories(icon_id);

-- Step 8: Enable RLS on new tables

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_icons ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for lookup tables (read-only for all authenticated users)

-- Currencies policies (read-only)
CREATE POLICY "Anyone can view currencies" ON public.currencies
  FOR SELECT USING (true);

-- Account types policies (read-only)
CREATE POLICY "Anyone can view account types" ON public.account_types
  FOR SELECT USING (true);

-- Transaction types policies (read-only)
CREATE POLICY "Anyone can view transaction types" ON public.transaction_types
  FOR SELECT USING (true);

-- Category icons policies (read-only)
CREATE POLICY "Anyone can view category icons" ON public.category_icons
  FOR SELECT USING (true);

-- Step 10: Create helper functions for 2NF compliance

-- Function to get account with type and currency info
CREATE OR REPLACE FUNCTION get_account_with_details(account_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  account_type_code TEXT,
  account_type_name TEXT,
  balance DECIMAL(15,2),
  currency_code TEXT,
  currency_symbol TEXT,
  is_active BOOLEAN,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    at.code as account_type_code,
    at.name as account_type_name,
    a.balance,
    c.code as currency_code,
    c.symbol as currency_symbol,
    a.is_active,
    a.user_id
  FROM public.accounts a
  LEFT JOIN public.account_types at ON a.account_type_id = at.id
  LEFT JOIN public.currencies c ON a.currency_id = c.id
  WHERE a.id = account_uuid;
END;
$$;

-- Function to get transaction with type info
CREATE OR REPLACE FUNCTION get_transaction_with_details(transaction_uuid UUID)
RETURNS TABLE (
  id UUID,
  date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  amount DECIMAL(15,2),
  transaction_type_code TEXT,
  transaction_type_name TEXT,
  user_id UUID,
  account_id UUID,
  category_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.date,
    t.description,
    t.amount,
    tt.code as transaction_type_code,
    tt.name as transaction_type_name,
    t.user_id,
    t.account_id,
    t.category_id
  FROM public.transactions t
  LEFT JOIN public.transaction_types tt ON t.transaction_type_id = tt.id
  WHERE t.id = transaction_uuid;
END;
$$;

-- Step 11: Grant permissions

GRANT SELECT ON public.currencies TO authenticated;
GRANT SELECT ON public.account_types TO authenticated;
GRANT SELECT ON public.transaction_types TO authenticated;
GRANT SELECT ON public.category_icons TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_with_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_with_details(UUID) TO authenticated;

-- Step 12: Add documentation comments

COMMENT ON TABLE public.currencies IS '2NF compliant: Currency lookup table to eliminate partial dependencies';
COMMENT ON TABLE public.account_types IS '2NF compliant: Account type lookup table to eliminate partial dependencies';
COMMENT ON TABLE public.transaction_types IS '2NF compliant: Transaction type lookup table to eliminate partial dependencies';
COMMENT ON TABLE public.category_icons IS '2NF compliant: Category icon lookup table to eliminate partial dependencies';

-- Step 13: Update app_versions

INSERT INTO public.app_versions (version, description) 
VALUES ('1.0.2-2nf', 'Implemented 2NF normalization with lookup tables')
ON CONFLICT (version) DO NOTHING; 