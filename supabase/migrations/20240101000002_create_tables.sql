-- ============================================
-- profiles (FR-005/007/071)
-- ============================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  profile_image text,
  provider public.provider_type DEFAULT 'email',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- teams (FR-010/011/012/071)
-- ============================================
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_teams_deleted_at ON public.teams(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- team_members (FR-017/018)
-- ============================================
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.user_role DEFAULT 'MEMBER' NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_deleted_at ON public.team_members(deleted_at) WHERE deleted_at IS NULL;

-- Ensure only one OWNER per team (active members only)
CREATE UNIQUE INDEX idx_team_members_one_owner 
  ON public.team_members(team_id) 
  WHERE role = 'OWNER' AND deleted_at IS NULL;

-- ============================================
-- team_invites (FR-013)
-- ============================================
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(email) <= 255),
  status public.invite_status DEFAULT 'pending' NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX idx_team_invites_email ON public.team_invites(email);
CREATE INDEX idx_team_invites_status ON public.team_invites(status) WHERE status = 'pending';

-- ============================================
-- projects (FR-020~027/071)
-- ============================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  is_archived boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_projects_team_id ON public.projects(team_id);
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_deleted_at ON public.projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_is_archived ON public.projects(is_archived) WHERE is_archived = false;

-- ============================================
-- project_statuses (FR-053/050)
-- ============================================
CREATE TABLE public.project_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 30),
  color text,
  position integer NOT NULL,
  is_base boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_project_statuses_project_id ON public.project_statuses(project_id);
CREATE UNIQUE INDEX idx_project_statuses_position ON public.project_statuses(project_id, position);

-- ============================================
-- project_wip_limits (FR-054)
-- ============================================
CREATE TABLE public.project_wip_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status_id uuid NOT NULL REFERENCES public.project_statuses(id) ON DELETE CASCADE,
  wip_limit integer NOT NULL CHECK (wip_limit BETWEEN 1 AND 50),
  UNIQUE(project_id, status_id)
);

-- ============================================
-- labels (FR-038)
-- ============================================
CREATE TABLE public.labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 30),
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

CREATE INDEX idx_labels_project_id ON public.labels(project_id);
CREATE INDEX idx_labels_deleted_at ON public.labels(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- issues (FR-030~037/039-2/040/041/045/052)
-- ============================================
CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR char_length(description) <= 5000),
  status_id uuid NOT NULL REFERENCES public.project_statuses(id) ON DELETE RESTRICT,
  priority public.priority DEFAULT 'MEDIUM' NOT NULL,
  assignee_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz,
  deleted_at timestamptz,
  ai_summary text,
  ai_suggestion text,
  ai_comment_summary text
);

CREATE INDEX idx_issues_project_id ON public.issues(project_id);
CREATE INDEX idx_issues_status_id ON public.issues(status_id);
CREATE INDEX idx_issues_assignee_user_id ON public.issues(assignee_user_id);
CREATE INDEX idx_issues_due_date ON public.issues(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_issues_created_at ON public.issues(created_at);
CREATE INDEX idx_issues_deleted_at ON public.issues(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_position ON public.issues(project_id, status_id, position);

-- ============================================
-- issue_labels (FR-038)
-- ============================================
CREATE TABLE public.issue_labels (
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, label_id)
);

CREATE INDEX idx_issue_labels_label_id ON public.issue_labels(label_id);

-- ============================================
-- subtasks (FR-039-2)
-- ============================================
CREATE TABLE public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  done boolean DEFAULT false NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

CREATE INDEX idx_subtasks_issue_id ON public.subtasks(issue_id);
CREATE INDEX idx_subtasks_deleted_at ON public.subtasks(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- comments (FR-060~063/061)
-- ============================================
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_comments_issue_id ON public.comments(issue_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at);
CREATE INDEX idx_comments_deleted_at ON public.comments(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- issue_history (FR-039)
-- ============================================
CREATE TABLE public.issue_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  changed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_issue_history_issue_id ON public.issue_history(issue_id);
CREATE INDEX idx_issue_history_changed_at ON public.issue_history(changed_at);

-- ============================================
-- activities (FR-019)
-- ============================================
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL,
  target text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_activities_team_id ON public.activities(team_id);
CREATE INDEX idx_activities_actor_id ON public.activities(actor_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at);

-- ============================================
-- notifications (FR-090/091)
-- ============================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- ============================================
-- favorites (FR-027)
-- ============================================
CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, project_id)
);

-- ============================================
-- ai_rate_limits (FR-042)
-- ============================================
CREATE TABLE public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  request_count integer DEFAULT 0 NOT NULL,
  window_start timestamptz DEFAULT now() NOT NULL,
  daily_count integer DEFAULT 0 NOT NULL,
  daily_reset timestamptz DEFAULT (CURRENT_DATE + interval '1 day') NOT NULL
);

CREATE INDEX idx_ai_rate_limits_user_id ON public.ai_rate_limits(user_id);

