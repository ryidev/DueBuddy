-- ============================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: CREATE ALL TABLES
-- ============================================

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: classrooms
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unique_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: classroom_members
CREATE TABLE IF NOT EXISTS classroom_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'contributor')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(classroom_id, profile_id)
);

-- TABLE: tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: task_completions
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(task_id, profile_id)
);

-- TABLE: push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(profile_id, endpoint)
);

-- ============================================
-- STEP 3: CREATE FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate unique classroom code
CREATE OR REPLACE FUNCTION generate_classroom_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text), 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create classroom with owner membership - FIXED VERSION
CREATE OR REPLACE FUNCTION create_classroom(
  p_name TEXT,
  p_unique_code TEXT,
  p_owner_id UUID
)
RETURNS classrooms AS $$
DECLARE
  v_classroom_id UUID;
  v_result classrooms;
BEGIN
  -- Create classroom
  INSERT INTO classrooms (name, unique_code, owner_id)
  VALUES (p_name, p_unique_code, p_owner_id)
  RETURNING * INTO v_result;

  -- Add owner as member
  INSERT INTO classroom_members (classroom_id, profile_id, role)
  VALUES (v_result.id, p_owner_id, 'owner');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 4: CREATE TRIGGERS
-- ============================================

-- Trigger for auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for classrooms updated_at
DROP TRIGGER IF EXISTS update_classrooms_updated_at ON classrooms;
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tasks updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: CREATE INDEXES
-- ============================================

-- Indexes for classrooms
CREATE INDEX IF NOT EXISTS idx_classrooms_owner_id ON classrooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_unique_code ON classrooms(unique_code);

-- Indexes for classroom_members
CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_id ON classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_profile_id ON classroom_members(profile_id);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_classroom_id ON tasks(classroom_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- Indexes for task_completions
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_profile_id ON task_completions(profile_id);

-- Indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile_id ON push_subscriptions(profile_id);

-- ============================================
-- STEP 6: ENABLE RLS POLICIES
-- ============================================

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Classrooms RLS
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view classroom" ON classrooms;
CREATE POLICY "Members can view classroom"
  ON classrooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = classrooms.id
      AND classroom_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can update classroom" ON classrooms;
CREATE POLICY "Owners can update classroom"
  ON classrooms FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete classroom" ON classrooms;
CREATE POLICY "Owners can delete classroom"
  ON classrooms FOR DELETE
  USING (owner_id = auth.uid());

-- Classroom Members RLS
ALTER TABLE classroom_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view membership" ON classroom_members;
CREATE POLICY "Members can view membership"
  ON classroom_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members cm
      WHERE cm.classroom_id = classroom_members.classroom_id
      AND cm.profile_id = auth.uid()
    )
  );

-- Tasks RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view tasks" ON tasks;
CREATE POLICY "Members can view tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create tasks" ON tasks;
CREATE POLICY "Members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
CREATE POLICY "Members can update tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can delete tasks (with deadline check)" ON tasks;
CREATE POLICY "Members can delete tasks (with deadline check)"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
    AND deadline > (NOW() + INTERVAL '24 hours')
  );

-- Task Completions RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view completions" ON task_completions;
CREATE POLICY "Members can view completions"
  ON task_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN classroom_members ON classroom_members.classroom_id = tasks.classroom_id
      WHERE tasks.id = task_completions.task_id
      AND classroom_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create completions" ON task_completions;
CREATE POLICY "Members can create completions"
  ON task_completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classroom_members
      JOIN tasks ON tasks.id = task_completions.task_id
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own completions" ON task_completions;
CREATE POLICY "Users can delete own completions"
  ON task_completions FOR DELETE
  USING (profile_id = auth.uid());

-- Push Subscriptions RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (profile_id = auth.uid());

-- ============================================
-- STEP 7: ENABLE REALTIME
-- ============================================
-- Note: These may fail if tables are already in publication
-- That's okay, you can continue with the rest of the script
DO $$
BEGIN
  -- Add tasks to publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;

  -- Add task_completions to publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE task_completions;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;

  -- Add classrooms to publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE classrooms;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;

  -- Add classroom_members to publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE classroom_members;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
END $$;

-- ============================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant select on tables
GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON classrooms TO anon, authenticated;
GRANT SELECT ON classroom_members TO anon, authenticated;
GRANT SELECT ON tasks TO anon, authenticated;
GRANT SELECT ON task_completions TO anon, authenticated;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION create_classroom TO authenticated;
GRANT EXECUTE ON FUNCTION generate_classroom_code TO authenticated;
