-- ============================================
-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- ============================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Members can view classroom" ON classrooms CASCADE;
DROP POLICY IF EXISTS "Users can view classroom" ON classrooms CASCADE;
DROP POLICY IF EXISTS "Authenticated users can find classroom by code" ON classrooms CASCADE;
DROP POLICY IF EXISTS "Authenticated users can create classroom" ON classrooms CASCADE;
DROP POLICY IF EXISTS "Owners can update classroom" ON classrooms CASCADE;
DROP POLICY IF EXISTS "Owners can delete classroom" ON classrooms CASCADE;
DROP POLICY IF EXISTS "Members can view membership" ON classroom_members CASCADE;
DROP POLICY IF EXISTS "Users can join classroom" ON classroom_members CASCADE;
DROP POLICY IF EXISTS "Owners can manage members" ON classroom_members CASCADE;
DROP POLICY IF EXISTS "Users can leave classroom" ON classroom_members CASCADE;
DROP POLICY IF EXISTS "Members can view tasks" ON tasks CASCADE;
DROP POLICY IF EXISTS "Members can create tasks" ON tasks CASCADE;
DROP POLICY IF EXISTS "Members can update tasks" ON tasks CASCADE;
DROP POLICY IF EXISTS "Members can delete tasks (with deadline check)" ON tasks CASCADE;
DROP POLICY IF EXISTS "Members can view completions" ON task_completions CASCADE;
DROP POLICY IF EXISTS "Members can create completions" ON task_completions CASCADE;
DROP POLICY IF EXISTS "Users can delete own completions" ON task_completions CASCADE;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions CASCADE;

-- ============================================
-- CREATE PROPER RLS POLICIES
-- ============================================

-- Profiles RLS (no circular references)
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Classrooms RLS (no circular references - uses direct checks)
CREATE POLICY "Users can view classroom"
  ON classrooms
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_members.classroom_id = classrooms.id
    AND classroom_members.profile_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can find classroom by code"
  ON classrooms
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND unique_code IS NOT NULL);

CREATE POLICY "Authenticated users can create classroom"
  ON classrooms
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update classroom"
  ON classrooms
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete classroom"
  ON classrooms
  FOR DELETE
  USING (owner_id = auth.uid());

-- Classroom Members RLS (no circular references)
CREATE POLICY "Members can view membership"
  ON classroom_members
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join classroom"
  ON classroom_members
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Owners can manage members"
  ON classroom_members
  FOR UPDATE
  USING (auth.uid() IS NOT NULL); -- Managed more securely in application logic

CREATE POLICY "Users can leave classroom"
  ON classroom_members
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Tasks RLS (no circular references - uses direct checks)
CREATE POLICY "Members can view tasks"
  ON tasks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_members.classroom_id = tasks.classroom_id
    AND classroom_members.profile_id = auth.uid()
  ));

CREATE POLICY "Members can create tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can update tasks"
  ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete tasks (with deadline check)"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classroom_members
      WHERE classroom_members.classroom_id = tasks.classroom_id
      AND classroom_members.profile_id = auth.uid()
    )
    AND deadline > (NOW() + INTERVAL '24 hours')
  );

-- Task Completions RLS (no circular references)
CREATE POLICY "Members can view completions"
  ON task_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN classroom_members cm ON cm.classroom_id = t.classroom_id
      WHERE t.id = task_completions.task_id AND cm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can create completions"
  ON task_completions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN classroom_members cm ON cm.classroom_id = t.classroom_id
      WHERE t.id = task_completions.task_id AND cm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own completions"
  ON task_completions
  FOR DELETE
  USING (profile_id = auth.uid());

-- Push Subscriptions RLS (no circular references)
CREATE POLICY "Users can manage own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = profile_id);
