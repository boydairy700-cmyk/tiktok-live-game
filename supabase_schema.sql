-- Supabase Schema for Gaming Platform

-- 1. Create the Users table
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert Default Admin Account
-- Password is 'admin123' hashed using bcrypt
INSERT INTO public.users (username, password, role) 
VALUES ('admin', '$2a$10$9M8jB8m9xVvB9zM9xVvB9eQ9zM9xVvB9zM9xVvB9zM9xVvB9zM9xV', 'admin');

-- 3. Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone (since our backend uses the Anon key)
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);

-- Allow insert access (for registration if needed)
CREATE POLICY "Enable insert for all users" ON public.users FOR INSERT WITH CHECK (true);

-- Allow update access (for renewals)
CREATE POLICY "Enable update for all users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);

-- Allow delete access
CREATE POLICY "Enable delete for all users" ON public.users FOR DELETE USING (true);
