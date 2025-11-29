-- Create custom enum types
CREATE TYPE public.user_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE public.priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE public.notification_type AS ENUM ('assigned', 'commented', 'due_soon', 'due_today', 'team_invite', 'role_changed', 'mentioned');
CREATE TYPE public.provider_type AS ENUM ('email', 'google');

