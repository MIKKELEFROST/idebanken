-- Brættet opdaterer sig selv, så en statusændring i admin er synlig for alle
-- med det samme — uden at nogen skal hente siden igen.
alter publication supabase_realtime add table public.ideas;
alter publication supabase_realtime add table public.comments;
