-- ============================================
-- Helper Functions for RLS
-- ============================================

-- Check if current user is a member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid
      AND user_id = auth.uid()
      AND deleted_at IS NULL
  );
$$;

-- Get user's role in a team
CREATE OR REPLACE FUNCTION public.get_user_role_in_team(team_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.team_members
  WHERE team_id = team_uuid
    AND user_id = auth.uid()
    AND deleted_at IS NULL;
$$;

-- Check if user is team OWNER or ADMIN
CREATE OR REPLACE FUNCTION public.is_team_admin_or_owner(team_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid
      AND user_id = auth.uid()
      AND role IN ('OWNER', 'ADMIN')
      AND deleted_at IS NULL
  );
$$;

-- Check if user is team OWNER
CREATE OR REPLACE FUNCTION public.is_team_owner(team_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid
      AND user_id = auth.uid()
      AND role = 'OWNER'
      AND deleted_at IS NULL
  );
$$;

-- Get team_id from project_id
CREATE OR REPLACE FUNCTION public.get_team_id_from_project(project_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT team_id FROM public.projects WHERE id = project_uuid AND deleted_at IS NULL;
$$;

-- Get team_id from issue_id
CREATE OR REPLACE FUNCTION public.get_team_id_from_issue(issue_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.team_id 
  FROM public.issues i
  JOIN public.projects p ON p.id = i.project_id
  WHERE i.id = issue_uuid AND i.deleted_at IS NULL AND p.deleted_at IS NULL;
$$;

-- ============================================
-- Trigger Functions
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, provider)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    CASE 
      WHEN new.raw_app_meta_data->>'provider' = 'google' THEN 'google'::provider_type
      ELSE 'email'::provider_type
    END
  );
  RETURN new;
END;
$$;

-- Create default statuses when a project is created
CREATE OR REPLACE FUNCTION public.create_default_statuses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.project_statuses (project_id, name, position, is_base) VALUES
    (NEW.id, 'Backlog', 0, true),
    (NEW.id, 'In Progress', 1, true),
    (NEW.id, 'Done', 2, true);
  RETURN NEW;
END;
$$;

-- Track issue history on update
CREATE OR REPLACE FUNCTION public.track_issue_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changed_by_id uuid;
BEGIN
  changed_by_id := auth.uid();
  
  -- Track title changes
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO public.issue_history (issue_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'title', to_jsonb(OLD.title), to_jsonb(NEW.title), changed_by_id);
  END IF;
  
  -- Track status changes
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    INSERT INTO public.issue_history (issue_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', to_jsonb(OLD.status_id), to_jsonb(NEW.status_id), changed_by_id);
  END IF;
  
  -- Track assignee changes
  IF OLD.assignee_user_id IS DISTINCT FROM NEW.assignee_user_id THEN
    INSERT INTO public.issue_history (issue_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'assignee', to_jsonb(OLD.assignee_user_id), to_jsonb(NEW.assignee_user_id), changed_by_id);
    
    -- Create notification for new assignee
    IF NEW.assignee_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        NEW.assignee_user_id,
        'assigned',
        jsonb_build_object(
          'issueId', NEW.id,
          'issueTitle', NEW.title,
          'projectId', NEW.project_id
        )
      );
    END IF;
  END IF;
  
  -- Track priority changes
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.issue_history (issue_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'priority', to_jsonb(OLD.priority), to_jsonb(NEW.priority), changed_by_id);
  END IF;
  
  -- Track due date changes
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO public.issue_history (issue_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'dueDate', to_jsonb(OLD.due_date), to_jsonb(NEW.due_date), changed_by_id);
  END IF;
  
  -- Track description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO public.issue_history (issue_id, field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'description', to_jsonb(OLD.description), to_jsonb(NEW.description), changed_by_id);
    
    -- Invalidate AI cache on description change
    NEW.ai_summary := NULL;
    NEW.ai_suggestion := NULL;
  END IF;
  
  -- Update updated_at
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create notification on new comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  issue_owner_id uuid;
  issue_assignee_id uuid;
  issue_title text;
  project_id uuid;
BEGIN
  SELECT i.owner_id, i.assignee_user_id, i.title, i.project_id
  INTO issue_owner_id, issue_assignee_id, issue_title, project_id
  FROM public.issues i
  WHERE i.id = NEW.issue_id;
  
  -- Notify issue owner (if not the commenter)
  IF issue_owner_id IS NOT NULL AND issue_owner_id != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      issue_owner_id,
      'commented',
      jsonb_build_object(
        'issueId', NEW.issue_id,
        'issueTitle', issue_title,
        'projectId', project_id,
        'commentId', NEW.id
      )
    );
  END IF;
  
  -- Notify assignee (if different from owner and not the commenter)
  IF issue_assignee_id IS NOT NULL 
     AND issue_assignee_id != NEW.author_id 
     AND issue_assignee_id != issue_owner_id THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      issue_assignee_id,
      'commented',
      jsonb_build_object(
        'issueId', NEW.issue_id,
        'issueTitle', issue_title,
        'projectId', project_id,
        'commentId', NEW.id
      )
    );
  END IF;
  
  -- Invalidate AI comment summary cache
  UPDATE public.issues 
  SET ai_comment_summary = NULL 
  WHERE id = NEW.issue_id;
  
  RETURN NEW;
END;
$$;

-- Add team member when team is created (owner)
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'OWNER');
  RETURN NEW;
END;
$$;

-- ============================================
-- Create Triggers
-- ============================================

-- Trigger: Create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Create default statuses on project creation
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_default_statuses();

-- Trigger: Track issue history
CREATE TRIGGER on_issue_updated
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.track_issue_history();

-- Trigger: Notify on new comment
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Trigger: Add owner as team member
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

