create or replace function public.can_access_direct_message_media(
  p_message_id text,
  p_sender_auth_user_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.direct_messages dm
    join public.profiles sender on sender.id = dm.sender_profile_id
    join public.profiles recipient on recipient.id = dm.recipient_profile_id
    where dm.id::text = p_message_id
      and sender.auth_user_id::text = p_sender_auth_user_id
      and auth.uid() in (sender.auth_user_id, recipient.auth_user_id)
  );
$$;

revoke all on function public.can_access_direct_message_media(text, text) from public, anon;
grant execute on function public.can_access_direct_message_media(text, text) to authenticated;

drop policy if exists "Message participants can read message attachments" on storage.objects;
create policy "Message participants can read message attachments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'community-media'
    and (storage.foldername(name))[1] = 'messages'
    and public.can_access_direct_message_media(
      (storage.foldername(name))[2],
      (storage.foldername(name))[3]
    )
  );
