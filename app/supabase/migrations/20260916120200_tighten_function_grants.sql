-- Supabase har default privileges, der giver anon/authenticated EXECUTE på alle
-- nye funktioner i public — og Postgres giver oveni EXECUTE til PUBLIC. Det
-- betyder at også trigger-funktionerne kunne kaldes direkte over REST-API'et.
-- De fejler ganske vist uden en trigger-kontekst, men de kører som ejeren, og
-- der er ingen grund til at de er eksponeret overhovedet.
--
-- Triggerne påvirkes ikke: EXECUTE tjekkes når triggeren oprettes, ikke hver
-- gang den fyrer.

revoke all on function public.sync_vote_counts() from public, anon, authenticated;
revoke all on function public.sync_comment_count() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

-- De fire RPC'er skal være offentlige — det er dem, hele det anonyme flow går
-- igennem — men adgangen skal komme fra en udtrykkelig grant, ikke fra
-- PUBLIC-standarden. is_admin giver kun mening for en indlogget bruger.
revoke all on function public.submit_idea(text, text, text, text, text, text, text) from public;
revoke all on function public.cast_vote(bigint, text, integer) from public;
revoke all on function public.add_comment(bigint, text, text, text) from public;
revoke all on function public.my_votes(text) from public;
revoke all on function public.is_admin() from public, anon;

grant execute on function public.submit_idea(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.cast_vote(bigint, text, integer) to anon, authenticated;
grant execute on function public.add_comment(bigint, text, text, text) to anon, authenticated;
grant execute on function public.my_votes(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- Lås søgestien på den sidste funktion der manglede den.
alter function public.touch_updated_at() set search_path = public, pg_temp;
