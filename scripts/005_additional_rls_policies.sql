-- Additional RLS policies for enhanced security

-- Policy to ensure users can only see their own profile data in auth context
CREATE POLICY "users_profile_access" ON public.users
  FOR ALL USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

-- Policy for assignments to ensure proper access control
CREATE POLICY "assignments_team_access" ON public.assignments
  FOR SELECT USING (
    -- Users can see their own assignments
    auth.uid() = user_id OR 
    -- Admins and supervisors can see all assignments
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERVISEUR')
    )
  );

-- Enhanced policy for projects to ensure proper visibility
CREATE POLICY "projects_visibility" ON public.projects
  FOR SELECT USING (
    -- All authenticated users can see projects (needed for assignments)
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()
    )
  );

-- Policy to prevent users from modifying their own role
CREATE POLICY "users_role_protection" ON public.users
  FOR UPDATE USING (
    -- Users can update their own data except role
    (auth.uid() = id AND OLD.role = NEW.role) OR
    -- Only admins can change roles
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Function to validate assignment constraints
CREATE OR REPLACE FUNCTION validate_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user is already assigned on this date
  IF EXISTS (
    SELECT 1 FROM public.assignments 
    WHERE user_id = NEW.user_id 
    AND assignment_date = NEW.assignment_date 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'User is already assigned to a project on this date';
  END IF;
  
  -- Check if project exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = NEW.project_id 
    AND status IN ('EN_COURS', 'EN_ATTENTE')
  ) THEN
    RAISE EXCEPTION 'Project does not exist or is not active';
  END IF;
  
  -- Check if user exists and is present
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = NEW.user_id 
    AND status = 'PRÉSENT'
  ) THEN
    RAISE EXCEPTION 'User does not exist or is not present';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assignment validation
DROP TRIGGER IF EXISTS validate_assignment_trigger ON public.assignments;
CREATE TRIGGER validate_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_assignment();

-- Function to log assignment changes for audit
CREATE OR REPLACE FUNCTION log_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- This could be extended to log to an audit table
  -- For now, we just ensure the created_by field is set
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for assignment logging
DROP TRIGGER IF EXISTS log_assignment_changes_trigger ON public.assignments;
CREATE TRIGGER log_assignment_changes_trigger
  BEFORE INSERT ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION log_assignment_changes();
