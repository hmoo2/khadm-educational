create extension if not exists pgcrypto;

create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  date_of_birth date not null,
  gender text not null check (gender in ('male', 'female')),
  education_type text not null check (education_type in ('general_secondary', 'azhar')),
  grade text not null check (grade in ('first_secondary', 'second_secondary', 'third_secondary')),
  division text check (division in ('science', 'mathematics', 'literary')),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (grade = 'third_secondary' or division is null),
  check (grade <> 'third_secondary' or division is not null)
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.student_conversations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  subject text not null check (subject ~ '^[a-z][a-z0-9_-]{0,39}$'),
  messages jsonb not null default '[]'::jsonb
    check (jsonb_typeof(messages) = 'array' and jsonb_array_length(messages) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_exam_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (subject ~ '^[a-z][a-z0-9_-]{0,39}$'),
  grade text not null check (grade in ('first_secondary', 'second_secondary', 'third_secondary')),
  education_type text not null check (education_type in ('general_secondary', 'azhar', 'training_comprehensive')),
  title text not null check (char_length(title) between 1 and 160),
  exam jsonb not null check (jsonb_typeof(exam) = 'object'),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'expired')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists student_conversations_user_updated_idx
  on public.student_conversations (user_id, updated_at desc);
create index if not exists student_exam_attempts_user_started_idx
  on public.student_exam_attempts (user_id, started_at desc);

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb;
begin
  metadata := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  insert into public.student_profiles (
    user_id,
    full_name,
    date_of_birth,
    gender,
    education_type,
    grade,
    division
  )
  values (
    new.id,
    metadata ->> 'full_name',
    (metadata ->> 'date_of_birth')::date,
    metadata ->> 'gender',
    metadata ->> 'education_type',
    metadata ->> 'grade',
    nullif(metadata ->> 'division', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_student_profile();

alter table public.student_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.student_conversations enable row level security;
alter table public.student_exam_attempts enable row level security;

revoke all on public.student_profiles from anon, authenticated;
grant select on public.student_profiles to authenticated;
grant update (full_name, date_of_birth, gender, education_type, grade, division, avatar_path, updated_at)
  on public.student_profiles to authenticated;

create policy "Students can read their own profile"
  on public.student_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Students can update their own profile"
  on public.student_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.user_roles from anon, authenticated;

revoke all on public.student_conversations from anon, authenticated;
grant select, insert, update, delete on public.student_conversations to authenticated;
create policy "Students can read their own conversations"
  on public.student_conversations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Students can create their own conversations"
  on public.student_conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Students can update their own conversations"
  on public.student_conversations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Students can delete their own conversations"
  on public.student_conversations for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.student_exam_attempts from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-media',
  'student-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Students can read files in their own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'student-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Students can upload files in their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'student-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Students can update files in their own folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'student-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'student-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Students can delete files in their own folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'student-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
