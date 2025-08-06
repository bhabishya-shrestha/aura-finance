-- Migration: Strategic Denormalization for Performance
-- Date: 2025-01-01
-- Description: Implement strategic denormalization to improve read performance
-- This migration adds computed columns and materialized views for frequently accessed data

-- Step 1: Add denormalized columns to transactions table for UI display
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS account_type_code TEXT,
ADD COLUMN IF NOT EXISTS account_type_icon TEXT,
ADD COLUMN IF NOT EXISTS account_type_color TEXT,
ADD COLUMN IF NOT EXISTS category_name TEXT,
ADD COLUMN IF NOT EXISTS category_icon TEXT,
ADD COLUMN IF NOT EXISTS category_color TEXT,
ADD COLUMN IF NOT EXISTS transaction_type_code TEXT,
ADD COLUMN IF NOT EXISTS transaction_type_icon TEXT,
ADD COLUMN IF NOT EXISTS transaction_type_color TEXT,
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$';

-- Step 2: Add denormalized columns to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS account_type_name TEXT,
ADD COLUMN IF NOT EXISTS account_type_icon TEXT,
ADD COLUMN IF NOT EXISTS account_type_color TEXT,
ADD COLUMN IF NOT EXISTS currency_name TEXT,
ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transaction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_expenses DECIMAL(15,2) DEFAULT 0;

-- Step 3: Add denormalized columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS icon_name TEXT,
ADD COLUMN IF NOT EXISTS icon_class TEXT,
ADD COLUMN IF NOT EXISTS color_hex TEXT,
ADD COLUMN IF NOT EXISTS transaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;

-- Step 4: Create materialized view for dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_analytics AS
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  -- Account summary
  COUNT(DISTINCT a.id) as total_accounts,
  SUM(a.balance) as total_balance,
  -- Transaction summary
  COUNT(t.id) as total_transactions,
  SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as total_income,
  SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as total_expenses,
  -- Recent activity
  MAX(t.date) as last_transaction_date,
  COUNT(CASE WHEN t.date >= NOW() - INTERVAL '30 days' THEN 1 END) as transactions_last_30_days,
  -- Net worth calculation
  SUM(a.balance) as net_worth,
  -- Monthly trends
  SUM(CASE WHEN t.date >= DATE_TRUNC('month', NOW()) AND t.amount > 0 THEN t.amount ELSE 0 END) as monthly_income,
  SUM(CASE WHEN t.date >= DATE_TRUNC('month', NOW()) AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as monthly_expenses
FROM public.users u
LEFT JOIN public.accounts a ON u.id = a.user_id AND a.is_active = true
LEFT JOIN public.transactions t ON a.id = t.account_id
GROUP BY u.id, u.email, u.name;

-- Step 5: Create materialized view for account performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.account_performance AS
SELECT 
  a.id as account_id,
  a.user_id,
  a.name as account_name,
  a.balance,
  at.code as account_type_code,
  at.name as account_type_name,
  ui.name as account_type_icon,
  uc.hex_code as account_type_color,
  c.code as currency_code,
  c.symbol as currency_symbol,
  -- Transaction counts
  COUNT(t.id) as transaction_count,
  COUNT(CASE WHEN t.date >= NOW() - INTERVAL '30 days' THEN 1 END) as transactions_last_30_days,
  -- Financial metrics
  SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as total_income,
  SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as total_expenses,
  SUM(CASE WHEN t.date >= DATE_TRUNC('month', NOW()) AND t.amount > 0 THEN t.amount ELSE 0 END) as monthly_income,
  SUM(CASE WHEN t.date >= DATE_TRUNC('month', NOW()) AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as monthly_expenses,
  -- Recent activity
  MAX(t.date) as last_transaction_date,
  MIN(t.date) as first_transaction_date
FROM public.accounts a
LEFT JOIN public.account_types at ON a.account_type_id = at.id
LEFT JOIN public.ui_icons ui ON at.icon_id = ui.id
LEFT JOIN public.ui_colors uc ON at.color_id = uc.id
LEFT JOIN public.currencies c ON a.currency_id = c.id
LEFT JOIN public.transactions t ON a.id = t.account_id
WHERE a.is_active = true
GROUP BY a.id, a.user_id, a.name, a.balance, at.code, at.name, ui.name, uc.hex_code, c.code, c.symbol;

-- Step 6: Create materialized view for category analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.category_analytics AS
SELECT 
  cat.id as category_id,
  cat.user_id,
  cat.name as category_name,
  ui.name as icon_name,
  ui.icon_class,
  uc.hex_code as color_hex,
  cat.is_default,
  -- Transaction metrics
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_amount,
  AVG(t.amount) as average_amount,
  -- Monthly trends
  COUNT(CASE WHEN t.date >= DATE_TRUNC('month', NOW()) THEN 1 END) as monthly_transactions,
  SUM(CASE WHEN t.date >= DATE_TRUNC('month', NOW()) THEN t.amount ELSE 0 END) as monthly_amount,
  -- Recent activity
  MAX(t.date) as last_transaction_date
FROM public.categories cat
LEFT JOIN public.category_icons ci ON cat.icon_id = ci.id
LEFT JOIN public.ui_icons ui ON ci.icon_id = ui.id
LEFT JOIN public.ui_colors uc ON cat.color_id = uc.id
LEFT JOIN public.transactions t ON cat.id = t.category_id
GROUP BY cat.id, cat.user_id, cat.name, ui.name, ui.icon_class, uc.hex_code, cat.is_default;

-- Step 7: Create indexes for denormalized columns
CREATE INDEX IF NOT EXISTS idx_transactions_account_name ON public.transactions(account_name);
CREATE INDEX IF NOT EXISTS idx_transactions_category_name ON public.transactions(category_name);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type_code ON public.transactions(transaction_type_code);
CREATE INDEX IF NOT EXISTS idx_transactions_date_amount ON public.transactions(date, amount);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type_name ON public.accounts(account_type_name);
CREATE INDEX IF NOT EXISTS idx_accounts_transaction_count ON public.accounts(transaction_count);
CREATE INDEX IF NOT EXISTS idx_categories_transaction_count ON public.categories(transaction_count);

-- Step 8: Create function to update denormalized data
CREATE OR REPLACE FUNCTION update_denormalized_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Update transaction denormalized data
  IF TG_TABLE_NAME = 'transactions' THEN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      -- Update transaction with account and category details
      UPDATE public.transactions 
      SET 
        account_name = a.name,
        account_type_code = at.code,
        account_type_icon = ui_acc.name,
        account_type_color = uc_acc.hex_code,
        category_name = c.name,
        category_icon = ui_cat.name,
        category_color = uc_cat.hex_code,
        transaction_type_code = tt.code,
        transaction_type_icon = ui_tt.name,
        transaction_type_color = uc_tt.hex_code,
        currency_code = curr.code,
        currency_symbol = curr.symbol
      FROM public.accounts a
      LEFT JOIN public.account_types at ON a.account_type_id = at.id
      LEFT JOIN public.ui_icons ui_acc ON at.icon_id = ui_acc.id
      LEFT JOIN public.ui_colors uc_acc ON at.color_id = uc_acc.id
      LEFT JOIN public.categories c ON NEW.category_id = c.id
      LEFT JOIN public.category_icons ci ON c.icon_id = ci.id
      LEFT JOIN public.ui_icons ui_cat ON ci.icon_id = ui_cat.id
      LEFT JOIN public.ui_colors uc_cat ON c.color_id = uc_cat.id
      LEFT JOIN public.transaction_types tt ON NEW.transaction_type_id = tt.id
      LEFT JOIN public.ui_icons ui_tt ON tt.icon_id = ui_tt.id
      LEFT JOIN public.ui_colors uc_tt ON tt.color_id = uc_tt.id
      LEFT JOIN public.currencies curr ON a.currency_id = curr.id
      WHERE transactions.id = NEW.id AND a.id = NEW.account_id;
      
      -- Update account transaction count and financial metrics
      UPDATE public.accounts 
      SET 
        transaction_count = (
          SELECT COUNT(*) FROM public.transactions WHERE account_id = NEW.account_id
        ),
        last_transaction_date = (
          SELECT MAX(date) FROM public.transactions WHERE account_id = NEW.account_id
        ),
        monthly_income = (
          SELECT COALESCE(SUM(amount), 0) 
          FROM public.transactions 
          WHERE account_id = NEW.account_id 
          AND date >= DATE_TRUNC('month', NOW()) 
          AND amount > 0
        ),
        monthly_expenses = (
          SELECT COALESCE(SUM(ABS(amount)), 0) 
          FROM public.transactions 
          WHERE account_id = NEW.account_id 
          AND date >= DATE_TRUNC('month', NOW()) 
          AND amount < 0
        )
      WHERE id = NEW.account_id;
      
      -- Update category transaction count and financial metrics
      IF NEW.category_id IS NOT NULL THEN
        UPDATE public.categories 
        SET 
          transaction_count = (
            SELECT COUNT(*) FROM public.transactions WHERE category_id = NEW.category_id
          ),
          total_amount = (
            SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE category_id = NEW.category_id
          )
        WHERE id = NEW.category_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create triggers to maintain denormalized data
DROP TRIGGER IF EXISTS trigger_update_denormalized_transactions ON public.transactions;
CREATE TRIGGER trigger_update_denormalized_transactions
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_denormalized_data();

-- Step 10: Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.dashboard_analytics;
  REFRESH MATERIALIZED VIEW public.account_performance;
  REFRESH MATERIALIZED VIEW public.category_analytics;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create function to get optimized transaction data
CREATE OR REPLACE FUNCTION get_transactions_optimized(
  user_uuid UUID,
  filters JSON DEFAULT '{}'::json
)
RETURNS TABLE (
  id UUID,
  date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  amount DECIMAL(15,2),
  account_name TEXT,
  account_type_code TEXT,
  account_type_icon TEXT,
  account_type_color TEXT,
  category_name TEXT,
  category_icon TEXT,
  category_color TEXT,
  transaction_type_code TEXT,
  transaction_type_icon TEXT,
  transaction_type_color TEXT,
  currency_code TEXT,
  currency_symbol TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.date,
    t.description,
    t.amount,
    t.account_name,
    t.account_type_code,
    t.account_type_icon,
    t.account_type_color,
    COALESCE(t.category_name, 'Uncategorized') as category_name,
    COALESCE(t.category_icon, 'tag') as category_icon,
    COALESCE(t.category_color, '#6B7280') as category_color,
    t.transaction_type_code,
    t.transaction_type_icon,
    t.transaction_type_color,
    t.currency_code,
    t.currency_symbol
  FROM public.transactions t
  INNER JOIN public.accounts a ON t.account_id = a.id
  WHERE a.user_id = user_uuid
  AND (filters->>'accountId' IS NULL OR t.account_id = (filters->>'accountId')::UUID)
  AND (filters->>'categoryId' IS NULL OR t.category_id = (filters->>'categoryId')::UUID)
  AND (filters->>'startDate' IS NULL OR t.date >= (filters->>'startDate')::TIMESTAMP)
  AND (filters->>'endDate' IS NULL OR t.date <= (filters->>'endDate')::TIMESTAMP)
  ORDER BY t.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create function to get optimized dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_data(user_uuid UUID)
RETURNS TABLE (
  total_balance DECIMAL(15,2),
  total_accounts INTEGER,
  total_transactions INTEGER,
  monthly_income DECIMAL(15,2),
  monthly_expenses DECIMAL(15,2),
  net_worth DECIMAL(15,2),
  transactions_last_30_days INTEGER,
  last_transaction_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.total_balance,
    da.total_accounts,
    da.total_transactions,
    da.monthly_income,
    da.monthly_expenses,
    da.net_worth,
    da.transactions_last_30_days,
    da.last_transaction_date
  FROM public.dashboard_analytics da
  WHERE da.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Grant permissions
GRANT SELECT ON public.dashboard_analytics TO authenticated;
GRANT SELECT ON public.account_performance TO authenticated;
GRANT SELECT ON public.category_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_transactions_optimized(UUID, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO authenticated;

-- Step 14: Add documentation comments
COMMENT ON MATERIALIZED VIEW public.dashboard_analytics IS 'Denormalized view for dashboard performance metrics';
COMMENT ON MATERIALIZED VIEW public.account_performance IS 'Denormalized view for account performance metrics';
COMMENT ON MATERIALIZED VIEW public.category_analytics IS 'Denormalized view for category performance metrics';
COMMENT ON FUNCTION get_transactions_optimized IS 'Optimized transaction query with denormalized data';
COMMENT ON FUNCTION get_dashboard_data IS 'Optimized dashboard data query';

-- Step 15: Update app_versions
INSERT INTO public.app_versions (version, description) 
VALUES ('1.0.4-denormalized', 'Implemented strategic denormalization for performance optimization')
ON CONFLICT (version) DO NOTHING; 