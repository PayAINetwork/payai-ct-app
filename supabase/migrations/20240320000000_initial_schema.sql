-- Create enum types
CREATE TYPE job_status AS ENUM ('created', 'funded', 'started', 'delivered', 'completed', 'cancelled');

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID not null REFERENCES auth.users(id) on delete cascade PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    avatar_url TEXT,
    handle TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    handle TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    twitter_user_id TEXT UNIQUE,
    bio TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES agents(id) NOT NULL,
    buyer_id UUID REFERENCES users(id) NOT NULL,
    amount DECIMAL(40, 20) NOT NULL,
    currency TEXT NOT NULL,
    description TEXT NOT NULL,
    escrow_address TEXT,
    post_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    offer_id UUID REFERENCES offers(id) NOT NULL,
    seller_id UUID REFERENCES agents(id) NOT NULL,
    buyer_id UUID REFERENCES users(id) NOT NULL,
    status job_status DEFAULT 'created',
    started_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id INTEGER REFERENCES jobs(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES users(id) NOT NULL
);

-- Create access_tokens table
CREATE TABLE IF NOT EXISTS access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    token_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_handle ON agents(handle);
CREATE INDEX idx_offers_seller_id ON offers(seller_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_jobs_offer_id ON jobs(offer_id);
CREATE INDEX idx_jobs_seller_id ON jobs(seller_id);
CREATE INDEX idx_jobs_buyer_id ON jobs(buyer_id);
CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_access_tokens_user_id ON access_tokens(user_id);
CREATE INDEX idx_access_tokens_token_hash ON access_tokens(token_hash);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Agents policies
CREATE POLICY "Anyone can view agents" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Agents can view their own data" ON agents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Agents can update their own data" ON agents
    FOR UPDATE USING (auth.uid() = user_id);

-- Offers policies
CREATE POLICY "Anyone can view offers" ON offers
    FOR SELECT USING (true);

CREATE POLICY "Users can create offers" ON offers
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own offers" ON offers
    FOR UPDATE USING (auth.uid() = created_by);

-- Jobs policies
CREATE POLICY "Anyone can view jobs" ON jobs
    FOR SELECT USING (true);

CREATE POLICY "Only buyers can create jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Sellers can only update job status to started or delivered
CREATE POLICY "Sellers can update job status to started or delivered" ON jobs
    FOR UPDATE USING (
        auth.uid() = seller_id AND
        (
            (status = 'funded' AND (SELECT status FROM jobs WHERE id = jobs.id) = 'started') OR
            (status = 'started' AND (SELECT status FROM jobs WHERE id = jobs.id) = 'delivered')
        )
    );

-- Admins can update job status to funded or completed
CREATE POLICY "Admins can update job status to funded or completed" ON jobs
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role' AND
        (
            (status = 'created' AND (SELECT status FROM jobs WHERE id = jobs.id) = 'funded') OR
            (status = 'delivered' AND (SELECT status FROM jobs WHERE id = jobs.id) = 'completed')
        )
    );

-- Admins and buyers can cancel jobs
CREATE POLICY "Admins and buyers can cancel jobs" ON jobs
    FOR UPDATE USING (
        (auth.uid() = buyer_id OR auth.jwt() ->> 'role' = 'service_role') AND
        (SELECT status FROM jobs WHERE id = jobs.id) = 'cancelled'
    );

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Only buyers can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_id
            AND jobs.buyer_id = auth.uid()
            AND jobs.status = 'completed'
        )
    );

-- Access tokens policies
CREATE POLICY "Users can view their own tokens" ON access_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens" ON access_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" ON access_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER SET search_path = public;

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Create_offer_and_job function to create an offer and a job atomically
CREATE OR REPLACE FUNCTION public.create_offer_and_job(
  p_seller_id   UUID,
  p_buyer_id    UUID,
  p_amount      NUMERIC,
  p_currency    TEXT,
  p_description TEXT,
  p_post_url    TEXT,
  p_created_by  UUID
)
RETURNS TABLE (offer_id UUID, job_id INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1) Insert into offers
  INSERT INTO offers (
    seller_id, buyer_id, amount, currency,
    description, post_url, created_by,
    created_at, updated_at
  )
  VALUES (
    p_seller_id, p_buyer_id, p_amount, p_currency,
    p_description, p_post_url, p_created_by,
    now(), now()
  )
  RETURNING id INTO offer_id;  -- capture new offer ID

  -- 2) Insert into jobs, referencing that offer
  INSERT INTO jobs (
    offer_id, seller_id, buyer_id,
    status, created_at, updated_at
  )
  VALUES (
    offer_id, p_seller_id, p_buyer_id,
    'created', now(), now()
  )
  RETURNING id INTO job_id;    -- capture new job ID

  -- 3) Return both IDs as a single row
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_offer_and_job(
  UUID, UUID, NUMERIC, TEXT, TEXT, TEXT, UUID
) TO authenticated; 

-- create function to populate user data after oauth authentication with supabase
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, picture, avatar_url, handle, created_at, updated_at)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'picture', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'user_name', new.created_at, new.updated_at)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- create trigger to call the function after insert on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user(); 

ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = public; 
