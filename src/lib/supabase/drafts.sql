-- Create a table for storing registration drafts
create table registration_drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  draft_data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id)
);

-- Enable Row Level Security (RLS)
alter table registration_drafts enable row level security;

-- Create policies to allow users to manage their own drafts
create policy "Users can view their own draft"
  on registration_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own draft"
  on registration_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own draft"
  on registration_drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own draft"
  on registration_drafts for delete
  using (auth.uid() = user_id);
