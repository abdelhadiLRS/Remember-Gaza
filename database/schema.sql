-- Palestinian Souls / Remember Gaza - Central PostgreSQL & Supabase Schema
-- Includes Role-Based Access Control (RBAC), Martyrs Directory, Edit Proposals,
-- Realtime Comments, Candles Tracker with Atomic Anti-Spam Rate Limiting, & Central Audit Logs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO roles (name, description) VALUES
    ('Administrator', 'Full access to system data, submissions, users, and audit logs'),
    ('Moderator', 'Review, approve, and reject community submissions and tributes'),
    ('Visitor', 'Read-only access to archive and capability to submit contributions')
ON CONFLICT (name) DO NOTHING;

-- 2. System Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(id) DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Central Martyrs Table
CREATE TABLE IF NOT EXISTS martyrs (
    id VARCHAR(100) PRIMARY KEY,
    category VARCHAR(100) DEFAULT 'Gazans',
    name_ar TEXT NOT NULL,
    name_en TEXT,
    age INT,
    gender VARCHAR(20),
    city TEXT,
    dob VARCHAR(50),
    dod VARCHAR(50),
    id_number VARCHAR(100),
    photo_url TEXT,
    bio TEXT,
    status VARCHAR(50) DEFAULT 'PUBLISHED',
    candles_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Edit Proposals & Community Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    martyr_id VARCHAR(100) REFERENCES martyrs(id) ON DELETE SET NULL,
    submitter_name VARCHAR(255) NOT NULL,
    submitter_contact VARCHAR(255),
    martyr_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Gazans',
    city VARCHAR(255),
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    notes TEXT,
    photo_url TEXT,
    proposed_data JSONB DEFAULT '{}'::jsonb,
    current_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'PENDING',
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(100)
);

-- 5. Realtime Comments & Testimonies Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    martyr_id VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL DEFAULT 'فاعل خير',
    author_location VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'APPROVED',
    ip_hash VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Candles Log Table
CREATE TABLE IF NOT EXISTS candles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    martyr_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100),
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast candle counts and rate limiting
CREATE INDEX IF NOT EXISTS idx_candles_martyr_id ON candles(martyr_id);
CREATE INDEX IF NOT EXISTS idx_candles_rate_limit ON candles(martyr_id, session_id, created_at);

-- 7. Administrative Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    username VARCHAR(100),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Atomic Candle Increment Function with Rate Limiting (Postgres RPC)
CREATE OR REPLACE FUNCTION light_candle(
    p_martyr_id VARCHAR(100),
    p_session_id VARCHAR(100) DEFAULT 'anonymous',
    p_ip_hash VARCHAR(64) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_last_candle TIMESTAMP WITH TIME ZONE;
    v_total_candles BIGINT;
    v_cooldown_seconds INT := 5; -- Rate limit: 1 candle per session every 5 seconds
BEGIN
    -- Check Rate Limit for session
    SELECT created_at INTO v_last_candle
    FROM candles
    WHERE martyr_id = p_martyr_id AND (session_id = p_session_id OR (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash))
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_candle IS NOT NULL AND (CURRENT_TIMESTAMP - v_last_candle) < (v_cooldown_seconds || ' seconds')::INTERVAL THEN
        -- Rate limit triggered
        SELECT COUNT(*) INTO v_total_candles FROM candles WHERE martyr_id = p_martyr_id;
        RETURN jsonb_build_object(
            'success', false,
            'rate_limited', true,
            'message', 'يرجى الانتظار القليل من الوقت قبل إشعال شمعة أخرى',
            'candles', v_total_candles
        );
    END IF;

    -- Record new candle
    INSERT INTO candles (martyr_id, session_id, ip_hash)
    VALUES (p_martyr_id, p_session_id, p_ip_hash);

    -- Update summary count in martyrs table if record exists
    UPDATE martyrs
    SET candles_count = COALESCE(candles_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_martyr_id;

    -- Count total candles
    SELECT COUNT(*) INTO v_total_candles FROM candles WHERE martyr_id = p_martyr_id;

    -- Audit Log entry
    INSERT INTO audit_logs (username, role, action, details)
    VALUES ('Visitor', 'Visitor', 'LIGHT_CANDLE', 'Lit a candle for martyr ID: ' || p_martyr_id);

    RETURN jsonb_build_object(
        'success', true,
        'rate_limited', false,
        'candles', v_total_candles
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Row Level Security (RLS) Policies
ALTER TABLE martyrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Martyrs Policies
CREATE POLICY "Public martyrs read" ON martyrs FOR SELECT USING (status = 'PUBLISHED' OR status IS NULL);

-- Submissions Policies
CREATE POLICY "Public submission insertion" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public submission select own" ON submissions FOR SELECT USING (true);

-- Comments Policies
CREATE POLICY "Public comments read" ON comments FOR SELECT USING (status = 'APPROVED');
CREATE POLICY "Public comments insert" ON comments FOR INSERT WITH CHECK (true);

-- Candles Policies
CREATE POLICY "Public candles select" ON candles FOR SELECT USING (true);
CREATE POLICY "Public candles insert" ON candles FOR INSERT WITH CHECK (true);

-- Audit Logs Policies
CREATE POLICY "Public audit select" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Public audit insert" ON audit_logs FOR INSERT WITH CHECK (true);
