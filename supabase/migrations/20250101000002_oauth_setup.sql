-- Migration: OAuth Setup for v1.0.0
-- Date: 2025-07-27
-- Description: Configure OAuth providers for authentication

-- Enable OAuth providers (these need to be configured in Supabase dashboard)
-- This migration documents the OAuth setup process

-- Note: OAuth providers must be configured in the Supabase dashboard:
-- 1. Go to Authentication > Providers
-- 2. Enable GitHub OAuth
-- 3. Enable Google OAuth
-- 4. Configure redirect URLs

-- Update app_versions table
INSERT INTO public.app_versions (version, description) 
VALUES ('1.0.0-oauth', 'OAuth authentication setup')
ON CONFLICT (version) DO NOTHING;

-- Create OAuth configuration table for future use
CREATE TABLE IF NOT EXISTS public.oauth_config (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  client_id VARCHAR(255),
  client_secret VARCHAR(255),
  redirect_url VARCHAR(255),
  scopes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default OAuth providers
INSERT INTO public.oauth_config (provider, is_enabled, scopes) VALUES
  ('github', false, ARRAY['read:user', 'user:email']),
  ('google', false, ARRAY['openid', 'email', 'profile'])
ON CONFLICT (provider) DO NOTHING;

-- Create function to update OAuth config
CREATE OR REPLACE FUNCTION update_oauth_config(
  p_provider VARCHAR(50),
  p_is_enabled BOOLEAN,
  p_client_id VARCHAR(255) DEFAULT NULL,
  p_client_secret VARCHAR(255) DEFAULT NULL,
  p_redirect_url VARCHAR(255) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.oauth_config 
  SET 
    is_enabled = p_is_enabled,
    client_id = COALESCE(p_client_id, client_id),
    client_secret = COALESCE(p_client_secret, client_secret),
    redirect_url = COALESCE(p_redirect_url, redirect_url),
    updated_at = NOW()
  WHERE provider = p_provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.oauth_config TO authenticated;
GRANT EXECUTE ON FUNCTION update_oauth_config TO authenticated; 