\set ON_ERROR_STOP on
\set QUIET on

create or replace function assert(cond boolean, what text)
returns void language plpgsql as $$
begin
  if cond then raise notice 'ok   %', what;
  else raise exception 'FAIL %', what;
  end if;
end $$;

-- Fanger "den her skulle have fejlet".
create or replace function assert_denied(stmt text, what text)
returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAIL % (kommandoen lykkedes, men skulle være afvist)', what;
exception
  when insufficient_privilege or check_violation or no_data_found then
    raise notice 'ok   % (afvist: %)', what, sqlerrm;
end $$;

\echo '--- offentlig læsning ---'
set role anon;

select assert(count(*) = 14, 'anon ser de 14 godkendte idéer') from ideas;
select assert_denied(
  'select visitor_key from ideas limit 1',
  'anon kan ikke læse visitor_key på idéer');
select assert_denied(
  'select visitor_key from comments limit 1',
  'anon kan ikke læse visitor_key på kommentarer');
select assert_denied(
  'select * from votes limit 1',
  'anon kan ikke læse stemmer');
select assert_denied(
  $$insert into ideas (title, body, category, importance) values ('xxxxx', repeat('y', 40), 'Kamp', 'Vigtigt')$$,
  'anon kan ikke indsætte direkte i ideas');
select assert_denied(
  $$update ideas set status = 'udgivet' where id = 41$$,
  'anon kan ikke ændre status');
select assert((select status from ideas where id = 41) = 'udvikling',
  'status på #41 er uændret');
select assert_denied(
  $$insert into comments (idea_id, body) values (41, 'hej')$$,
  'anon kan ikke indsætte direkte i comments');
select assert_denied(
  $$insert into votes (idea_id, visitor_key, value) values (41, 'v1', 1)$$,
  'anon kan ikke indsætte direkte i votes');
select assert_denied(
  $$update board_settings set require_approval = false where id = 1$$,
  'anon kan ikke ændre indstillinger');

\echo '--- indsendelse ---'
select assert(submit_idea('En helt ny idé', repeat('Beskrivelse der er lang nok. ', 3), 'Kamp', 'Vigtigt', 'Testbruger', 'visitor-a', '') = 100,
  'submit_idea returnerer nyt id');
select assert(count(*) = 14, 'idéen venter i køen og er ikke på brættet') from ideas;

select assert_denied(
  $$select submit_idea('Bot-idé', repeat('spam ', 10), 'Kamp', 'Vigtigt', '', 'visitor-bot', 'jeg-er-en-bot')$$,
  'honeypot afviser indsendelsen');
select assert_denied(
  $$select submit_idea('For kort', 'nej', 'Kamp', 'Vigtigt', '', 'visitor-a', '')$$,
  'for kort beskrivelse afvises');
select assert_denied(
  $$select submit_idea('Uden besøgs-id', repeat('lang nok beskrivelse ', 3), 'Kamp', 'Vigtigt', '', '', '')$$,
  'manglende visitor_key afvises');

-- Fire mere fra samme besøgende: den femte i alt er ok, den sjette ikke.
select submit_idea('Idé nummer ' || i, repeat('Beskrivelse der er lang nok. ', 3), 'Kamp', 'Vigtigt', '', 'visitor-a', '')
  from generate_series(2, 5) as i;
select assert_denied(
  $$select submit_idea('En for meget', repeat('Beskrivelse der er lang nok. ', 3), 'Kamp', 'Vigtigt', '', 'visitor-a', '')$$,
  'rate limit stopper indsendelse nummer seks');

\echo '--- stemmer ---'
-- #55 har base 74 op / 3 ned.
select assert((select up_count from ideas where id = 55) = 74, 'startpunkt fra eksempeldata');

select assert((cast_vote(55, 'visitor-b', 1)).up_count = 75, 'en stemme for lægger sig oven på base-tallet');
select assert((select my_vote from cast_vote(55, 'visitor-b', 1)) = 0, 'samme stemme igen fjerner den');
select assert((select up_count from ideas where id = 55) = 74, 'tallet er tilbage hvor det var');

select assert((cast_vote(55, 'visitor-b', 1)).up_count = 75, 'stemmer for igen');
select assert((cast_vote(55, 'visitor-b', -1)).down_count = 4, 'skift til imod flytter stemmen');
select assert((select up_count from ideas where id = 55) = 74, 'op-tallet gik ned igen ved skiftet');
select assert((select count(*) from my_votes('visitor-b')) = 1, 'my_votes viser én stemme');

select assert_denied(
  $$select cast_vote(100, 'visitor-b', 1)$$,
  'man kan ikke stemme på en idé der venter i køen');

\echo '--- kommentarer ---'
select assert((select comment_count from ideas where id = 57) = 0, 'ingen kommentarer på #57 til at starte med');
select add_comment(57, 'visitor-b', 'Meget enig i den her.', '');
select assert((select comment_count from ideas where id = 57) = 1, 'tælleren følger med');
select assert((select author from comments where idea_id = 57) = 'Anonym', 'tomt navn bliver til Anonym');
select assert_denied(
  $$select add_comment(100, 'visitor-b', 'hej', '')$$,
  'man kan ikke kommentere en idé i køen');

reset role;

\echo '--- admin ---'
set "test.jwt" = '{"email":"chef@example.com"}';
set role authenticated;
select assert(is_admin() = false, 'ukendt e-mail er ikke admin');
select assert(count(*) = 14, 'ikke-admin ser kun brættet') from ideas;
update ideas set status = 'udgivet' where id = 41;
select assert((select status from ideas where id = 41) = 'udvikling',
  'ikke-admins opdatering rammer nul rækker og ændrer intet');
select assert_denied(
  $$insert into ideas (title, body, category, importance)
      values ('Snydeidé', repeat('lang nok beskrivelse ', 3), 'Kamp', 'Vigtigt')$$,
  'ikke-admin kan ikke indsætte en idé udenom køen');
select assert_denied(
  'select visitor_key from ideas limit 1',
  'ikke-admin kan heller ikke læse visitor_key');
delete from ideas where id = 41;
select assert((select count(*) from ideas where id = 41) = 1,
  'ikke-admins sletning rammer nul rækker — idéen er der stadig');

reset role;
insert into admins (email) values ('chef@example.com');

set "test.jwt" = '{"email":"CHEF@example.com"}';
set role authenticated;
select assert(is_admin() = true, 'e-mail på listen er admin (uanset store bogstaver)');
select assert(count(*) = 19, 'admin ser også de fem i køen') from ideas;

update ideas set review_state = 'approved', status = 'nye' where id = 100;
select assert((select review_state from ideas where id = 100) = 'approved', 'admin kan godkende');

update ideas set status = 'udvikling', official_reply = 'Vi kigger på den' where id = 100;
select assert((select status from ideas where id = 100) = 'udvikling', 'admin kan flytte kortet');

update comments set hidden = true where idea_id = 57;
select assert((select comment_count from ideas where id = 57) = 0, 'skjult kommentar tæller ikke med');

reset role;

\echo '--- efter godkendelse ---'
set role anon;
select assert(count(*) = 15, 'den godkendte idé er nu på brættet') from ideas;
select assert((select count(*) from comments where idea_id = 57) = 0, 'anon ser ikke den skjulte kommentar');
select assert((cast_vote(100, 'visitor-c', 1)).up_count = 2,
  'der kan stemmes på den nu (indsenderens egen stemme talt med)');

reset role;

\echo '--- dislike slået fra ---'
update board_settings set allow_dislike = false where id = 1;
set role anon;
select assert_denied(
  $$select cast_vote(55, 'visitor-d', -1)$$,
  'imod-stemmer afvises når reglen er slået fra');
select assert((cast_vote(55, 'visitor-d', 1)).up_count = 75, 'for-stemmer virker stadig');
reset role;

\echo '--- godkendelse slået fra ---'
update board_settings set require_approval = false where id = 1;
set role anon;
select submit_idea('Direkte på brættet', repeat('Beskrivelse der er lang nok. ', 3), 'Klubber', 'Vigtigt', '', 'visitor-e', '');
select assert((select review_state from ideas order by id desc limit 1) = 'approved',
  'uden godkendelseskrav lander idéen direkte på brættet');
reset role;

\echo '=== alle tests kørt ==='
