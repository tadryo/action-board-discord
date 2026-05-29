create table app_settings (
  key   text primary key,
  value text not null
);

alter table app_settings enable row level security;
create policy "Public read" on app_settings for select using (true);
