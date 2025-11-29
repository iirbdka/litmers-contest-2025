-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_wip_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- profiles policies
-- ============================================
-- Users can view profiles of team members
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of team members"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm1
      JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = profiles.id
        AND tm1.deleted_at IS NULL
        AND tm2.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- teams policies
-- ============================================
CREATE POLICY "Team members can view their teams"
  ON public.teams FOR SELECT
  USING (public.is_team_member(id) AND deleted_at IS NULL);

CREATE POLICY "Any authenticated user can create a team"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owner/admin can update team"
  ON public.teams FOR UPDATE
  USING (public.is_team_admin_or_owner(id) AND deleted_at IS NULL);

CREATE POLICY "Team owner can delete team"
  ON public.teams FOR DELETE
  USING (public.is_team_owner(id));

-- ============================================
-- team_members policies
-- ============================================
CREATE POLICY "Team members can view team members"
  ON public.team_members FOR SELECT
  USING (public.is_team_member(team_id) AND deleted_at IS NULL);

CREATE POLICY "Team admin/owner can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (public.is_team_admin_or_owner(team_id));

CREATE POLICY "Team admin/owner can update member roles"
  ON public.team_members FOR UPDATE
  USING (
    public.is_team_admin_or_owner(team_id)
    AND deleted_at IS NULL
    -- Admin cannot change owner's role
    AND NOT (role = 'OWNER' AND NOT public.is_team_owner(team_id))
  );

CREATE POLICY "Team admin/owner can remove members"
  ON public.team_members FOR DELETE
  USING (
    public.is_team_admin_or_owner(team_id)
    -- Cannot remove owner, only soft delete
    AND role != 'OWNER'
  );

-- ============================================
-- team_invites policies
-- ============================================
CREATE POLICY "Team members can view invites"
  ON public.team_invites FOR SELECT
  USING (public.is_team_member(team_id));

CREATE POLICY "Team admin/owner can create invites"
  ON public.team_invites FOR INSERT
  WITH CHECK (public.is_team_admin_or_owner(team_id));

CREATE POLICY "Team admin/owner can update invites"
  ON public.team_invites FOR UPDATE
  USING (public.is_team_admin_or_owner(team_id));

CREATE POLICY "Invited user can view their invite by email"
  ON public.team_invites FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
    AND expires_at > now()
  );

-- ============================================
-- projects policies
-- ============================================
CREATE POLICY "Team members can view projects"
  ON public.projects FOR SELECT
  USING (public.is_team_member(team_id) AND deleted_at IS NULL);

CREATE POLICY "Team members can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    public.is_team_member(team_id)
    AND auth.uid() = owner_id
  );

CREATE POLICY "Project owner or team admin can update project"
  ON public.projects FOR UPDATE
  USING (
    (owner_id = auth.uid() OR public.is_team_admin_or_owner(team_id))
    AND deleted_at IS NULL
  );

CREATE POLICY "Project owner or team owner can delete project"
  ON public.projects FOR DELETE
  USING (
    owner_id = auth.uid() OR public.is_team_owner(team_id)
  );

-- ============================================
-- project_statuses policies
-- ============================================
CREATE POLICY "Team members can view project statuses"
  ON public.project_statuses FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
  );

CREATE POLICY "Team members can manage project statuses"
  ON public.project_statuses FOR INSERT
  WITH CHECK (
    public.is_team_member(public.get_team_id_from_project(project_id))
  );

CREATE POLICY "Team members can update project statuses"
  ON public.project_statuses FOR UPDATE
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
  );

CREATE POLICY "Team members can delete non-base statuses"
  ON public.project_statuses FOR DELETE
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
    AND is_base = false
  );

-- ============================================
-- project_wip_limits policies
-- ============================================
CREATE POLICY "Team members can view WIP limits"
  ON public.project_wip_limits FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
  );

CREATE POLICY "Team members can manage WIP limits"
  ON public.project_wip_limits FOR ALL
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
  );

-- ============================================
-- labels policies
-- ============================================
CREATE POLICY "Team members can view labels"
  ON public.labels FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
    AND deleted_at IS NULL
  );

CREATE POLICY "Team members can manage labels"
  ON public.labels FOR ALL
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
  );

-- ============================================
-- issues policies
-- ============================================
CREATE POLICY "Team members can view issues"
  ON public.issues FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
    AND deleted_at IS NULL
  );

CREATE POLICY "Team members can create issues"
  ON public.issues FOR INSERT
  WITH CHECK (
    public.is_team_member(public.get_team_id_from_project(project_id))
    AND auth.uid() = owner_id
  );

CREATE POLICY "Team members can update issues"
  ON public.issues FOR UPDATE
  USING (
    public.is_team_member(public.get_team_id_from_project(project_id))
    AND deleted_at IS NULL
  );

CREATE POLICY "Issue owner or team admin can delete issue"
  ON public.issues FOR DELETE
  USING (
    owner_id = auth.uid() 
    OR public.is_team_admin_or_owner(public.get_team_id_from_project(project_id))
  );

-- ============================================
-- issue_labels policies
-- ============================================
CREATE POLICY "Team members can view issue labels"
  ON public.issue_labels FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_issue(issue_id))
  );

CREATE POLICY "Team members can manage issue labels"
  ON public.issue_labels FOR ALL
  USING (
    public.is_team_member(public.get_team_id_from_issue(issue_id))
  );

-- ============================================
-- subtasks policies
-- ============================================
CREATE POLICY "Team members can view subtasks"
  ON public.subtasks FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_issue(issue_id))
    AND deleted_at IS NULL
  );

CREATE POLICY "Team members can manage subtasks"
  ON public.subtasks FOR ALL
  USING (
    public.is_team_member(public.get_team_id_from_issue(issue_id))
  );

-- ============================================
-- comments policies
-- ============================================
CREATE POLICY "Team members can view comments"
  ON public.comments FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_issue(issue_id))
    AND deleted_at IS NULL
  );

CREATE POLICY "Team members can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    public.is_team_member(public.get_team_id_from_issue(issue_id))
    AND auth.uid() = author_id
  );

CREATE POLICY "Comment author can update their comment"
  ON public.comments FOR UPDATE
  USING (
    author_id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "Comment author or team admin can delete comment"
  ON public.comments FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.is_team_admin_or_owner(public.get_team_id_from_issue(issue_id))
  );

-- ============================================
-- issue_history policies
-- ============================================
CREATE POLICY "Team members can view issue history"
  ON public.issue_history FOR SELECT
  USING (
    public.is_team_member(public.get_team_id_from_issue(issue_id))
  );

-- History is created by triggers, not directly by users
CREATE POLICY "System can create history"
  ON public.issue_history FOR INSERT
  WITH CHECK (true);

-- ============================================
-- activities policies
-- ============================================
CREATE POLICY "Team members can view activities"
  ON public.activities FOR SELECT
  USING (public.is_team_member(team_id));

CREATE POLICY "Team members can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (
    public.is_team_member(team_id)
    AND auth.uid() = actor_id
  );

-- ============================================
-- notifications policies
-- ============================================
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- favorites policies
-- ============================================
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own favorites"
  ON public.favorites FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- ai_rate_limits policies
-- ============================================
CREATE POLICY "Users can view their own rate limits"
  ON public.ai_rate_limits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits"
  ON public.ai_rate_limits FOR ALL
  WITH CHECK (true);

