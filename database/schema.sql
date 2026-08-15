-- Palestinian Souls / Remember Gaza - PostgreSQL / Supabase Database Schema
-- Provides Role-Based Access Control (RBAC), Submissions Workflow, Tributes & Audit Logs

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles & Permissions Table
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
    role_id INT REFERENCES roles(id) DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Community Submissions Table
CREATE TYPE submission_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submitter_name VARCHAR(255) NOT NULL,
    martyr_name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    notes TEXT NOT NULL,
    photo_url TEXT,
    status submission_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id)
);

-- 4. Virtual Tributes & Messages Table
CREATE TABLE IF NOT EXISTS tributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    martyr_id VARCHAR(100) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status submission_status DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Administrative Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    username VARCHAR(100),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) Policies
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public submission insertion" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public tributes read" ON tributes FOR SELECT USING (status = 'APPROVED');
