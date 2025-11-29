-- ============================================
-- pg_cron Job for Due Date Notifications (FR-090)
-- Run daily at 00:05 to create due_soon and due_today notifications
-- ============================================

-- Enable pg_cron extension if not already enabled
-- Note: This needs to be enabled via Supabase dashboard for hosted projects
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to create due date notifications
CREATE OR REPLACE FUNCTION public.create_due_date_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  issue_row RECORD;
BEGIN
  -- Due Today notifications (D-day)
  FOR issue_row IN
    SELECT 
      i.id as issue_id,
      i.title,
      i.project_id,
      i.assignee_user_id,
      i.owner_id
    FROM public.issues i
    WHERE i.deleted_at IS NULL
      AND i.due_date::date = CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM public.project_statuses ps 
        WHERE ps.id = i.status_id AND ps.name = 'Done'
      )
  LOOP
    -- Notify assignee
    IF issue_row.assignee_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        issue_row.assignee_user_id,
        'due_today',
        jsonb_build_object(
          'issueId', issue_row.issue_id,
          'issueTitle', issue_row.title,
          'projectId', issue_row.project_id
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Notify owner if different from assignee
    IF issue_row.owner_id IS NOT NULL AND issue_row.owner_id != issue_row.assignee_user_id THEN
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        issue_row.owner_id,
        'due_today',
        jsonb_build_object(
          'issueId', issue_row.issue_id,
          'issueTitle', issue_row.title,
          'projectId', issue_row.project_id
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Due Soon notifications (D-1)
  FOR issue_row IN
    SELECT 
      i.id as issue_id,
      i.title,
      i.project_id,
      i.assignee_user_id,
      i.owner_id
    FROM public.issues i
    WHERE i.deleted_at IS NULL
      AND i.due_date::date = CURRENT_DATE + 1
      AND NOT EXISTS (
        SELECT 1 FROM public.project_statuses ps 
        WHERE ps.id = i.status_id AND ps.name = 'Done'
      )
  LOOP
    -- Notify assignee
    IF issue_row.assignee_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        issue_row.assignee_user_id,
        'due_soon',
        jsonb_build_object(
          'issueId', issue_row.issue_id,
          'issueTitle', issue_row.title,
          'projectId', issue_row.project_id
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Notify owner if different from assignee
    IF issue_row.owner_id IS NOT NULL AND issue_row.owner_id != issue_row.assignee_user_id THEN
      INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        issue_row.owner_id,
        'due_soon',
        jsonb_build_object(
          'issueId', issue_row.issue_id,
          'issueTitle', issue_row.title,
          'projectId', issue_row.project_id
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Schedule the job to run daily at 00:05 (requires pg_cron)
-- Uncomment after enabling pg_cron in Supabase dashboard:
-- SELECT cron.schedule(
--   'due-date-notifications',
--   '5 0 * * *',
--   $$SELECT public.create_due_date_notifications()$$
-- );

