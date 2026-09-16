-- Eksempelindhold fra prototypen, så brættet ikke står tomt.
-- Ryd det hele igen med:  delete from public.ideas where id < 100;

insert into public.ideas
  (id, title, body, category, importance, author, status, review_state, official_reply, created_at)
values
  (19, 'Besked når min kamp går i gang',
   'Jeg vil have en notifikation lige inden kampstart, så jeg kan følge den live i stedet for at læse referatet bagefter.',
   'Liga og turneringer', 'Vigtigt', 'Anonym bruger', 'udgivet', 'approved',
   'Udgivet. Kan slås til under Indstillinger → Beskeder.', now() - interval '6 months'),

  (22, 'Advarsel om skadesrisiko før jeg vælger træningsintensitet',
   'Hård fysisk træning dagen før en cupkamp koster mig spillere. Vis en risikoindikator pr. spiller inden jeg vælger intensitet.',
   'Træning', 'Kritisk for mig', 'Anonym bruger', 'udgivet', 'approved',
   'Udgivet. Risikoen vises pr. spiller når du vælger pas.', now() - interval '4 months'),

  (31, 'Mulighed for at slå klubbots helt fra i private ligaer',
   'I vores private liga vil vi kun spille mod rigtige managere, også selvom der bliver huller i kalenderen.',
   'Klubbots', 'Nice to have', 'Anonym bruger', 'afvist', 'approved',
   'Afvist: en liga med huller ødelægger tabellen. Vi ser i stedet på bedre bots.', now() - interval '3 months'),

  (35, 'Automatisk opstilling når man er væk',
   'Når jeg er væk i to uger spiller jeg med 10 mand. Lad systemet vælge den bedste 11 efter form og friskhed.',
   'Kamp', 'Vigtigt', 'Anonym bruger', 'vurdering', 'approved',
   'Vi er i tvivl om det gør konkurrencen for nem — den ligger til vurdering.', now() - interval '2 months'),

  (38, 'Individuelle træningsprogrammer pr. spiller',
   'Hele truppen træner det samme. Jeg vil kunne give en ung back et program med fokus på forsvar og udholdenhed, mens angriberen træner afslutninger.',
   'Træning', 'Vigtigt', 'Anonym bruger', 'planlagt', 'approved',
   'Planlagt. Vi regner med 4-6 fokusområder pr. spiller.', now() - interval '1 month'),

  (41, 'Vis opstillingen som et taktikbræt i stedet for en liste',
   'Jeg sætter holdet op i en liste og kan ikke se hvordan det faktisk står på banen. Et bræt hvor man trækker spillerne rundt, med roller og afstande, ville gøre det meget nemmere at forstå sin egen opstilling.',
   'Kamp', 'Kritisk for mig', 'Anonym bruger', 'udvikling', 'approved',
   'Vi bygger den nu. Første version har træk-og-slip og fire faste formationer.', now() - interval '3 weeks'),

  (44, 'Graf over en spillers udvikling hen over sæsonen',
   'Jeg kan se en spillers tal i dag, men ikke om han er blevet bedre siden sommer. En simpel kurve pr. egenskab ville være nok.',
   'Spilleregenskaber, værdier og vurderinger', 'Nice to have', 'Søren', 'planlagt', 'approved',
   '', now() - interval '5 weeks'),

  (46, 'Klubbots skal handle mere realistisk på markedet',
   'Bot-klubberne byder ikke på spillere og sælger aldrig, så markedet står stille i de lave divisioner. Lad dem købe efter behov og budget.',
   'Klubbots', 'Vigtigt', 'Anonym bruger', 'vurdering', 'approved',
   '', now() - interval '10 days'),

  (47, 'Turneringer man kan følge live med bracket',
   'Man kan kun se sin egen kamp. Et bracket der opdaterer sig mens runden spilles, ville gøre cupaftener meget sjovere.',
   'Liga og turneringer', 'Vigtigt', 'Anonym bruger', 'test', 'approved',
   'Ligger i test og kommer med næste opdatering.', now() - interval '2 weeks'),

  (49, 'Gentag sidste kamps opstilling med én knap',
   'Jeg sætter det samme hold op manuelt hver gang. En knap der henter sidste kamps opstilling og roller ville spare mig fem minutter dagligt.',
   'Kamp', 'Vigtigt', 'Anonym bruger', 'udvikling', 'approved',
   '', now() - interval '3 weeks'),

  (52, 'Del budgettet op i løn og transfer — med varsel når det strammer',
   'I dag er det ét stort tal, så jeg opdager først at lønnen løber løbsk når det er for sent. Vis to budgetter og advar mig inden jeg skriver en kontrakt jeg ikke kan betale.',
   'Økonomi', 'Kritisk for mig', 'Anonym bruger', 'vurdering', 'approved',
   '', now() - interval '6 days'),

  (55, 'Vis usikkerhed på vurderinger i stedet for ét fast tal',
   'En spiller får ét tal for potentiale, men i virkeligheden er det et gæt. Vis et interval, så man selv skal tage en risiko — det gør scouting til et rigtigt valg.',
   'Spilleregenskaber, værdier og vurderinger', 'Vigtigt', 'Anders', 'nye', 'approved',
   '', now() - interval '2 days'),

  (57, 'Klubhistorik med rekorder og tidligere sæsoner',
   'Der er ingen hukommelse i klubben. En side med sæsoner, placeringer, topscorere og rekorder ville give noget at spille for på lang bane.',
   'Klubber', 'Vigtigt', 'Anonym bruger', 'nye', 'approved',
   '', now() - interval '1 day'),

  (58, 'Gem søgninger på markedet og få besked ved nye spillere',
   'Jeg søger efter det samme hver dag: venstreback under 23 år i en bestemt prisklasse. Lad mig gemme søgningen og få en besked når der kommer en ny der passer.',
   'Markedet', 'Nice to have', 'Anonym bruger', 'nye', 'approved',
   '', now() - interval '4 days');

insert into public.comments (idea_id, author, body, created_at) values
  (41, 'Anonym', 'Ja tak. Det er det første jeg leder efter når jeg logger ind.', now() - interval '2 weeks'),
  (41, 'Mikkel', 'Gerne med mulighed for at gemme flere opstillinger.', now() - interval '9 days'),
  (38, 'Anonym', 'Vigtigt at det ikke bliver noget man SKAL sætte hver dag.', now() - interval '3 weeks'),
  (52, 'Anonym', 'Og gerne en prognose for resten af sæsonen.', now() - interval '4 days'),
  (44, 'Anonym', 'Og gerne kunne sammenligne to spillere i samme graf.', now() - interval '2 weeks');

-- Stemmetallene fra prototypen. De lægges i base_* så rigtige stemmer lægger
-- sig oven på dem i stedet for at nulstille dem.
update public.ideas
   set base_up = v.up, base_down = v.down, up_count = v.up, down_count = v.down
  from (values
    (19, 276, 12), (22, 341, 7), (31, 61, 34), (35, 148, 29), (38, 288, 14),
    (41, 412, 9), (44, 164, 11), (46, 88, 1), (47, 121, 2), (49, 203, 4),
    (52, 96, 1), (55, 74, 3), (57, 51, 2), (58, 33, 6)
  ) as v(id, up, down)
 where public.ideas.id = v.id;

-- Identity-sekvensen skal fortsætte efter de faste id'er ovenfor.
select setval(pg_get_serial_sequence('public.ideas', 'id'), 100, false);
