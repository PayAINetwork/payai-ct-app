-- Create function to handle new auth user
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
 drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger to call the function after insert on auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user(); 