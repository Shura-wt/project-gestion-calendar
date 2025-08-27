-- RLS Policies for users table
CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

CREATE POLICY "users_insert_policy" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- RLS Policies for projects table
CREATE POLICY "projects_select_policy" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "projects_insert_policy" ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

CREATE POLICY "projects_update_policy" ON public.projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

CREATE POLICY "projects_delete_policy" ON public.projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- RLS Policies for assignments table
CREATE POLICY "assignments_select_policy" ON public.assignments
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

CREATE POLICY "assignments_insert_policy" ON public.assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

CREATE POLICY "assignments_update_policy" ON public.assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

CREATE POLICY "assignments_delete_policy" ON public.assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );
