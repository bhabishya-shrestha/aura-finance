-- API Usage Tracking Migration
-- This migration adds server-side validation for AI API usage to prevent exploitation

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('gemini', 'huggingface')),
    request_count INTEGER DEFAULT 1,
    daily_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per provider per day
    UNIQUE(user_id, provider, daily_date)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_user_provider_date 
ON api_usage(user_id, provider, daily_date);

-- Create function to get current daily usage for a user and provider
CREATE OR REPLACE FUNCTION get_daily_api_usage(
    p_user_id UUID,
    p_provider VARCHAR(50)
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    SELECT COALESCE(request_count, 0)
    INTO usage_count
    FROM api_usage
    WHERE user_id = p_user_id 
    AND provider = p_provider 
    AND daily_date = CURRENT_DATE;
    
    RETURN COALESCE(usage_count, 0);
END;
$$;

-- Create function to increment API usage
CREATE OR REPLACE FUNCTION increment_api_usage(
    p_user_id UUID,
    p_provider VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage INTEGER;
    max_requests INTEGER;
    usage_record RECORD;
BEGIN
    -- Get current usage
    current_usage := get_daily_api_usage(p_user_id, p_provider);
    
    -- Set max requests based on provider
    IF p_provider = 'gemini' THEN
        max_requests := 150;
    ELSIF p_provider = 'huggingface' THEN
        max_requests := 500;
    ELSE
        RAISE EXCEPTION 'Invalid provider: %', p_provider;
    END IF;
    
    -- Check if user has exceeded daily limit
    IF current_usage >= max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update usage record
    INSERT INTO api_usage (user_id, provider, request_count, daily_date)
    VALUES (p_user_id, p_provider, 1, CURRENT_DATE)
    ON CONFLICT (user_id, provider, daily_date)
    DO UPDATE SET 
        request_count = api_usage.request_count + 1,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- Create function to validate API usage before processing
CREATE OR REPLACE FUNCTION validate_api_usage(
    p_user_id UUID,
    p_provider VARCHAR(50)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage INTEGER;
    max_requests INTEGER;
    remaining_requests INTEGER;
    can_proceed BOOLEAN;
    result JSON;
BEGIN
    -- Get current usage
    current_usage := get_daily_api_usage(p_user_id, p_provider);
    
    -- Set max requests based on provider
    IF p_provider = 'gemini' THEN
        max_requests := 150;
    ELSIF p_provider = 'huggingface' THEN
        max_requests := 500;
    ELSE
        RAISE EXCEPTION 'Invalid provider: %', p_provider;
    END IF;
    
    remaining_requests := max_requests - current_usage;
    can_proceed := remaining_requests > 0;
    
    -- Build result object
    result := json_build_object(
        'can_proceed', can_proceed,
        'current_usage', current_usage,
        'max_requests', max_requests,
        'remaining_requests', GREATEST(remaining_requests, 0),
        'provider', p_provider,
        'daily_date', CURRENT_DATE
    );
    
    RETURN result;
END;
$$;

-- Create function to get usage statistics for a user
CREATE OR REPLACE FUNCTION get_user_api_usage_stats(
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    gemini_usage INTEGER;
    huggingface_usage INTEGER;
    result JSON;
BEGIN
    -- Get usage for both providers
    gemini_usage := get_daily_api_usage(p_user_id, 'gemini');
    huggingface_usage := get_daily_api_usage(p_user_id, 'huggingface');
    
    -- Build result object
    result := json_build_object(
        'gemini', json_build_object(
            'current_usage', gemini_usage,
            'max_requests', 150,
            'remaining_requests', GREATEST(150 - gemini_usage, 0),
            'approaching_limit', gemini_usage >= 120
        ),
        'huggingface', json_build_object(
            'current_usage', huggingface_usage,
            'max_requests', 500,
            'remaining_requests', GREATEST(500 - huggingface_usage, 0),
            'approaching_limit', huggingface_usage >= 400
        ),
        'daily_date', CURRENT_DATE
    );
    
    RETURN result;
END;
$$;

-- Create RLS policies for security
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own API usage" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users cannot insert/update/delete their own usage (only functions can)
CREATE POLICY "No direct user modifications" ON api_usage
    FOR ALL USING (false);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON api_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_api_usage(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_api_usage(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_api_usage(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_api_usage_stats(UUID) TO authenticated;

-- Create a cleanup function to remove old usage records (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_api_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_usage 
    WHERE daily_date < CURRENT_DATE - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_api_usage() TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE api_usage IS 'Tracks daily API usage for AI providers to prevent exploitation';
COMMENT ON FUNCTION get_daily_api_usage IS 'Gets current daily usage count for a user and provider';
COMMENT ON FUNCTION increment_api_usage IS 'Increments API usage and returns false if limit exceeded';
COMMENT ON FUNCTION validate_api_usage IS 'Validates if user can make API request and returns usage stats';
COMMENT ON FUNCTION get_user_api_usage_stats IS 'Gets comprehensive usage statistics for a user';
COMMENT ON FUNCTION cleanup_old_api_usage IS 'Removes API usage records older than 30 days'; 