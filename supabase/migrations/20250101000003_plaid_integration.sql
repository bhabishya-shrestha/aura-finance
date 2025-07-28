-- Migration: Plaid Integration Setup
-- Date: 2025-01-01
-- Description: Add Plaid integration tables for secure financial data storage

-- Create Plaid items table (stores connected financial institutions)
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT UNIQUE NOT NULL, -- Plaid's item ID
  access_token TEXT NOT NULL, -- Encrypted access token
  institution_id TEXT NOT NULL,
  status TEXT DEFAULT 'good' CHECK (status IN ('good', 'pending', 'bad')),
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Plaid accounts table (stores account information from connected institutions)
CREATE TABLE IF NOT EXISTS public.plaid_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plaid_item_id TEXT REFERENCES public.plaid_items(item_id) ON DELETE CASCADE NOT NULL,
  plaid_account_id TEXT UNIQUE NOT NULL, -- Plaid's account ID
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  mask TEXT,
  current_balance DECIMAL(15,2),
  available_balance DECIMAL(15,2),
  iso_currency_code TEXT DEFAULT 'USD',
  unofficial_currency_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Plaid transactions table (stores transaction data from connected accounts)
CREATE TABLE IF NOT EXISTS public.plaid_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plaid_item_id TEXT REFERENCES public.plaid_items(item_id) ON DELETE CASCADE NOT NULL,
  plaid_transaction_id TEXT UNIQUE NOT NULL, -- Plaid's transaction ID
  plaid_account_id TEXT NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  pending BOOLEAN DEFAULT false,
  category TEXT, -- Comma-separated category names
  category_id TEXT, -- Plaid's category ID
  location JSONB, -- Location data as JSON
  payment_channel TEXT,
  pending_transaction_id TEXT,
  account_owner TEXT,
  transaction_code TEXT,
  merchant_name TEXT,
  check_number TEXT,
  payment_meta JSONB, -- Payment metadata as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Plaid usage tracking table (for free tier limits)
CREATE TABLE IF NOT EXISTS public.plaid_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_items_item_id ON public.plaid_items(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_items_status ON public.plaid_items(status);

CREATE INDEX IF NOT EXISTS idx_plaid_accounts_user_id ON public.plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON public.plaid_accounts(plaid_item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_account_id ON public.plaid_accounts(plaid_account_id);

CREATE INDEX IF NOT EXISTS idx_plaid_transactions_user_id ON public.plaid_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_item_id ON public.plaid_transactions(plaid_item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_account_id ON public.plaid_transactions(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_date ON public.plaid_transactions(date);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_transaction_id ON public.plaid_transactions(plaid_transaction_id);

CREATE INDEX IF NOT EXISTS idx_plaid_usage_user_id ON public.plaid_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_usage_timestamp ON public.plaid_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_plaid_usage_endpoint ON public.plaid_usage(endpoint);

-- Enable Row Level Security (RLS)
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Plaid items
CREATE POLICY "Users can view own plaid items" ON public.plaid_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid items" ON public.plaid_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid items" ON public.plaid_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid items" ON public.plaid_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for Plaid accounts
CREATE POLICY "Users can view own plaid accounts" ON public.plaid_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid accounts" ON public.plaid_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid accounts" ON public.plaid_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid accounts" ON public.plaid_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for Plaid transactions
CREATE POLICY "Users can view own plaid transactions" ON public.plaid_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid transactions" ON public.plaid_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid transactions" ON public.plaid_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid transactions" ON public.plaid_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for Plaid usage
CREATE POLICY "Users can view own plaid usage" ON public.plaid_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid usage" ON public.plaid_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_plaid_items_updated_at
  BEFORE UPDATE ON public.plaid_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plaid_accounts_updated_at
  BEFORE UPDATE ON public.plaid_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plaid_transactions_updated_at
  BEFORE UPDATE ON public.plaid_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user's Plaid usage summary
CREATE OR REPLACE FUNCTION public.get_plaid_usage_summary(user_uuid UUID, month_date DATE DEFAULT NULL)
RETURNS TABLE (
  endpoint TEXT,
  request_count BIGINT,
  month_start DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pu.endpoint,
    COUNT(*) as request_count,
    DATE_TRUNC('month', COALESCE(month_date, CURRENT_DATE))::DATE as month_start
  FROM public.plaid_usage pu
  WHERE pu.user_id = user_uuid
    AND pu.timestamp >= DATE_TRUNC('month', COALESCE(month_date, CURRENT_DATE))
    AND pu.timestamp < DATE_TRUNC('month', COALESCE(month_date, CURRENT_DATE)) + INTERVAL '1 month'
  GROUP BY pu.endpoint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_plaid_usage_summary(UUID, DATE) TO authenticated;

-- Create function to check if user is within free tier limits
CREATE OR REPLACE FUNCTION public.check_plaid_free_tier_limits(user_uuid UUID)
RETURNS TABLE (
  is_within_limits BOOLEAN,
  transactions_remaining INTEGER,
  total_transactions BIGINT,
  month_start DATE
) AS $$
DECLARE
  current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  transaction_count BIGINT;
BEGIN
  -- Get transaction count for current month
  SELECT COUNT(*) INTO transaction_count
  FROM public.plaid_usage
  WHERE user_id = user_uuid
    AND endpoint = '/transactions/get'
    AND timestamp >= current_month
    AND timestamp < current_month + INTERVAL '1 month';
  
  RETURN QUERY
  SELECT 
    transaction_count < 2000 as is_within_limits,
    GREATEST(0, 2000 - transaction_count)::INTEGER as transactions_remaining,
    transaction_count,
    current_month as month_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.check_plaid_free_tier_limits(UUID) TO authenticated; 