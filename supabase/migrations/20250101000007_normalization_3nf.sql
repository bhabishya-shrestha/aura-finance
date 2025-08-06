-- Migration: Normalization 3NF Implementation
-- Date: 2025-01-01
-- Description: Implement 3NF by eliminating transitive dependencies and creating UI attribute tables

-- Step 1: Create UI attribute tables for 3NF compliance

-- UI colors lookup table (eliminates transitive dependency on color attributes)
CREATE TABLE IF NOT EXISTS public.ui_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- Color name (primary, secondary, success, etc.)
  hex_code TEXT NOT NULL, -- Hex color code
  rgb_code TEXT, -- RGB color code
  description TEXT, -- Description of the color
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UI icons lookup table (eliminates transitive dependency on icon attributes)
CREATE TABLE IF NOT EXISTS public.ui_icons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- Icon name
  icon_class TEXT NOT NULL, -- CSS class or icon library reference
  icon_type TEXT DEFAULT 'lucide', -- Icon library type (lucide, fontawesome, etc.)
  description TEXT, -- Description of the icon
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Insert default data into UI attribute tables

-- Insert default UI colors
INSERT INTO public.ui_colors (name, hex_code, rgb_code, description) VALUES
  ('primary', '#3B82F6', 'rgb(59, 130, 246)', 'Primary brand color'),
  ('secondary', '#6B7280', 'rgb(107, 114, 128)', 'Secondary brand color'),
  ('success', '#10B981', 'rgb(16, 185, 129)', 'Success/positive actions'),
  ('warning', '#F59E0B', 'rgb(245, 158, 11)', 'Warning/caution actions'),
  ('danger', '#EF4444', 'rgb(239, 68, 68)', 'Danger/error actions'),
  ('info', '#06B6D4', 'rgb(6, 182, 212)', 'Information actions'),
  ('light', '#F3F4F6', 'rgb(243, 244, 246)', 'Light background color'),
  ('dark', '#1F2937', 'rgb(31, 41, 55)', 'Dark background color'),
  ('purple', '#8B5CF6', 'rgb(139, 92, 246)', 'Purple accent color'),
  ('pink', '#EC4899', 'rgb(236, 72, 153)', 'Pink accent color'),
  ('orange', '#F97316', 'rgb(249, 115, 22)', 'Orange accent color'),
  ('teal', '#14B8A6', 'rgb(20, 184, 166)', 'Teal accent color')
ON CONFLICT (name) DO NOTHING;

-- Insert default UI icons
INSERT INTO public.ui_icons (name, icon_class, icon_type, description) VALUES
  ('credit-card', 'CreditCard', 'lucide', 'Credit card icon'),
  ('piggy-bank', 'PiggyBank', 'lucide', 'Savings/piggy bank icon'),
  ('trending-up', 'TrendingUp', 'lucide', 'Investment/trending up icon'),
  ('arrow-down', 'ArrowDown', 'lucide', 'Income/down arrow icon'),
  ('arrow-up', 'ArrowUp', 'lucide', 'Expense/up arrow icon'),
  ('repeat', 'Repeat', 'lucide', 'Transfer/repeat icon'),
  ('utensils', 'Utensils', 'lucide', 'Food & dining icon'),
  ('car', 'Car', 'lucide', 'Transportation icon'),
  ('shopping-bag', 'ShoppingBag', 'lucide', 'Shopping icon'),
  ('film', 'Film', 'lucide', 'Entertainment icon'),
  ('heart', 'Heart', 'lucide', 'Healthcare icon'),
  ('zap', 'Zap', 'lucide', 'Utilities icon'),
  ('dollar-sign', 'DollarSign', 'lucide', 'Salary/money icon'),
  ('home', 'Home', 'lucide', 'Housing icon'),
  ('graduation-cap', 'GraduationCap', 'lucide', 'Education icon'),
  ('plane', 'Plane', 'lucide', 'Travel icon'),
  ('gift', 'Gift', 'lucide', 'Gifts icon')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Add foreign key columns to existing tables

-- Add color_id to account_types table
ALTER TABLE public.account_types 
ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES public.ui_colors(id) ON DELETE SET NULL;

-- Add icon_id to account_types table
ALTER TABLE public.account_types 
ADD COLUMN IF NOT EXISTS icon_id UUID REFERENCES public.ui_icons(id) ON DELETE SET NULL;

-- Add color_id to transaction_types table
ALTER TABLE public.transaction_types 
ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES public.ui_colors(id) ON DELETE SET NULL;

-- Add icon_id to transaction_types table
ALTER TABLE public.transaction_types 
ADD COLUMN IF NOT EXISTS icon_id UUID REFERENCES public.ui_icons(id) ON DELETE SET NULL;

-- Add icon_id to category_icons table (replacing icon_class)
ALTER TABLE public.category_icons 
ADD COLUMN IF NOT EXISTS icon_id UUID REFERENCES public.ui_icons(id) ON DELETE SET NULL;

-- Add color_id to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES public.ui_colors(id) ON DELETE SET NULL;

-- Step 4: Migrate existing data to use foreign keys

-- Update account_types to use color_id and icon_id
UPDATE public.account_types 
SET color_id = (SELECT id FROM public.ui_colors WHERE hex_code = account_types.color)
WHERE color_id IS NULL AND color IS NOT NULL;

UPDATE public.account_types 
SET icon_id = (SELECT id FROM public.ui_icons WHERE name = account_types.icon)
WHERE icon_id IS NULL AND icon IS NOT NULL;

-- Update transaction_types to use color_id and icon_id
UPDATE public.transaction_types 
SET color_id = (SELECT id FROM public.ui_colors WHERE hex_code = transaction_types.color)
WHERE color_id IS NULL AND color IS NOT NULL;

UPDATE public.transaction_types 
SET icon_id = (SELECT id FROM public.ui_icons WHERE name = transaction_types.icon)
WHERE icon_id IS NULL AND icon IS NOT NULL;

-- Update category_icons to use icon_id
UPDATE public.category_icons 
SET icon_id = (SELECT id FROM public.ui_icons WHERE name = category_icons.name)
WHERE icon_id IS NULL;

-- Update categories to use color_id
UPDATE public.categories 
SET color_id = (SELECT id FROM public.ui_colors WHERE hex_code = categories.color)
WHERE color_id IS NULL AND color IS NOT NULL;

-- Step 5: Make foreign key columns NOT NULL where appropriate

-- Make icon_id NOT NULL for account_types
UPDATE public.account_types SET icon_id = (SELECT id FROM public.ui_icons WHERE name = 'credit-card') WHERE icon_id IS NULL;
ALTER TABLE public.account_types ALTER COLUMN icon_id SET NOT NULL;

-- Make color_id NOT NULL for account_types
UPDATE public.account_types SET color_id = (SELECT id FROM public.ui_colors WHERE name = 'primary') WHERE color_id IS NULL;
ALTER TABLE public.account_types ALTER COLUMN color_id SET NOT NULL;

-- Make icon_id NOT NULL for transaction_types
UPDATE public.transaction_types SET icon_id = (SELECT id FROM public.ui_icons WHERE name = 'arrow-up') WHERE icon_id IS NULL;
ALTER TABLE public.transaction_types ALTER COLUMN icon_id SET NOT NULL;

-- Make color_id NOT NULL for transaction_types
UPDATE public.transaction_types SET color_id = (SELECT id FROM public.ui_colors WHERE name = 'danger') WHERE color_id IS NULL;
ALTER TABLE public.transaction_types ALTER COLUMN color_id SET NOT NULL;

-- Make icon_id NOT NULL for category_icons
UPDATE public.category_icons SET icon_id = (SELECT id FROM public.ui_icons WHERE name = 'utensils') WHERE icon_id IS NULL;
ALTER TABLE public.category_icons ALTER COLUMN icon_id SET NOT NULL;

-- Step 6: Drop old columns (after ensuring data migration)

-- Drop old columns from account_types
ALTER TABLE public.account_types DROP COLUMN IF EXISTS color;
ALTER TABLE public.account_types DROP COLUMN IF EXISTS icon;

-- Drop old columns from transaction_types
ALTER TABLE public.transaction_types DROP COLUMN IF EXISTS color;
ALTER TABLE public.transaction_types DROP COLUMN IF EXISTS icon;

-- Drop old columns from category_icons
ALTER TABLE public.category_icons DROP COLUMN IF EXISTS icon_class;

-- Drop old columns from categories (keep color for now as it might be user-specific)
-- ALTER TABLE public.categories DROP COLUMN IF EXISTS color;

-- Step 7: Create indexes for better performance

CREATE INDEX IF NOT EXISTS idx_account_types_color_id ON public.account_types(color_id);
CREATE INDEX IF NOT EXISTS idx_account_types_icon_id ON public.account_types(icon_id);
CREATE INDEX IF NOT EXISTS idx_transaction_types_color_id ON public.transaction_types(color_id);
CREATE INDEX IF NOT EXISTS idx_transaction_types_icon_id ON public.transaction_types(icon_id);
CREATE INDEX IF NOT EXISTS idx_category_icons_icon_id ON public.category_icons(icon_id);
CREATE INDEX IF NOT EXISTS idx_categories_color_id ON public.categories(color_id);

-- Step 8: Enable RLS on new tables

ALTER TABLE public.ui_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_icons ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for UI attribute tables (read-only for all authenticated users)

-- UI colors policies (read-only)
CREATE POLICY "Anyone can view UI colors" ON public.ui_colors
  FOR SELECT USING (true);

-- UI icons policies (read-only)
CREATE POLICY "Anyone can view UI icons" ON public.ui_icons
  FOR SELECT USING (true);

-- Step 10: Create enhanced helper functions for 3NF compliance

-- Function to get account with complete UI details
CREATE OR REPLACE FUNCTION get_account_with_ui_details(account_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  account_type_code TEXT,
  account_type_name TEXT,
  account_type_icon TEXT,
  account_type_color TEXT,
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
    ui.name as account_type_icon,
    uc.hex_code as account_type_color,
    a.balance,
    c.code as currency_code,
    c.symbol as currency_symbol,
    a.is_active,
    a.user_id
  FROM public.accounts a
  LEFT JOIN public.account_types at ON a.account_type_id = at.id
  LEFT JOIN public.ui_icons ui ON at.icon_id = ui.id
  LEFT JOIN public.ui_colors uc ON at.color_id = uc.id
  LEFT JOIN public.currencies c ON a.currency_id = c.id
  WHERE a.id = account_uuid;
END;
$$;

-- Function to get transaction with complete UI details
CREATE OR REPLACE FUNCTION get_transaction_with_ui_details(transaction_uuid UUID)
RETURNS TABLE (
  id UUID,
  date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  amount DECIMAL(15,2),
  transaction_type_code TEXT,
  transaction_type_name TEXT,
  transaction_type_icon TEXT,
  transaction_type_color TEXT,
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
    ui.name as transaction_type_icon,
    uc.hex_code as transaction_type_color,
    t.user_id,
    t.account_id,
    t.category_id
  FROM public.transactions t
  LEFT JOIN public.transaction_types tt ON t.transaction_type_id = tt.id
  LEFT JOIN public.ui_icons ui ON tt.icon_id = ui.id
  LEFT JOIN public.ui_colors uc ON tt.color_id = uc.id
  WHERE t.id = transaction_uuid;
END;
$$;

-- Function to get category with complete UI details
CREATE OR REPLACE FUNCTION get_category_with_ui_details(category_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  icon_name TEXT,
  icon_class TEXT,
  color_hex TEXT,
  is_default BOOLEAN,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    ui.name as icon_name,
    ui.icon_class,
    uc.hex_code as color_hex,
    c.is_default,
    c.user_id
  FROM public.categories c
  LEFT JOIN public.category_icons ci ON c.icon_id = ci.id
  LEFT JOIN public.ui_icons ui ON ci.icon_id = ui.id
  LEFT JOIN public.ui_colors uc ON c.color_id = uc.id
  WHERE c.id = category_uuid;
END;
$$;

-- Step 11: Grant permissions

GRANT SELECT ON public.ui_colors TO authenticated;
GRANT SELECT ON public.ui_icons TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_with_ui_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_with_ui_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_with_ui_details(UUID) TO authenticated;

-- Step 12: Add documentation comments

COMMENT ON TABLE public.ui_colors IS '3NF compliant: UI color lookup table to eliminate transitive dependencies';
COMMENT ON TABLE public.ui_icons IS '3NF compliant: UI icon lookup table to eliminate transitive dependencies';
COMMENT ON FUNCTION get_account_with_ui_details IS '3NF compliant: Gets account with complete UI details';
COMMENT ON FUNCTION get_transaction_with_ui_details IS '3NF compliant: Gets transaction with complete UI details';
COMMENT ON FUNCTION get_category_with_ui_details IS '3NF compliant: Gets category with complete UI details';

-- Step 13: Update app_versions

INSERT INTO public.app_versions (version, description) 
VALUES ('1.0.3-3nf', 'Implemented 3NF normalization with UI attribute tables')
ON CONFLICT (version) DO NOTHING; 