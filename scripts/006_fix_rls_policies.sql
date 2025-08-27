-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

DROP POLICY IF EXISTS "assignments_select_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignments_insert_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignments_update_policy" ON public.assignments;
DROP POLICY IF EXISTS "assignments_delete_policy" ON public.assignments;

-- Create function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Fixed RLS Policies for users table using the function
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    get_user_role(auth.uid()) IN ('ADMIN', 'SUPERVISEUR')
  );

CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) = 'ADMIN'
  );

CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR 
    get_user_role(auth.uid()) = 'ADMIN'
  );

CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE USING (
    get_user_role(auth.uid()) = 'ADMIN'
  );

-- Fixed RLS Policies for projects table using the function
CREATE POLICY "projects_select_policy" ON public.projects
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "projects_insert_policy" ON public.projects
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('ADMIN', 'SUPERVISEUR')
  );

CREATE POLICY "projects_update_policy" ON public.projects
  FOR UPDATE USING (
    get_user_role(auth.uid()) IN ('ADMIN', 'SUPERVISEUR')
  );

CREATE POLICY "projects_delete_policy" ON public.projects
  FOR DELETE USING (
    get_user_role(auth.uid()) = 'ADMIN'
  );

-- Fixed RLS Policies for assignments table using the function
CREATE POLICY "assignments_select_policy" ON public.assignments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    get_user_role(auth.uid()) IN ('ADMIN', 'SUPERVISEUR')
  );

CREATE POLICY "assignments_insert_policy" ON public.assignments
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('ADMIN', 'SUPERVISEUR')
  );

CREATE POLICY "assignments_update_policy" ON public.assignments
  FOR UPDATE USING (
    get_user_role(auth.uid()) IN ('ADMIN', 'SUPERVISEUR')
  );

CREATE POLICY "assignments_delete_policy" ON public.assignments
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('ADMIN', 'SUPERVISEUR')
  );
