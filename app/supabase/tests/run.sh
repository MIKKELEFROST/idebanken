#!/usr/bin/env bash
# Kører migrationer, seed og testene mod en lokal Postgres — ikke mod det
# rigtige Supabase-projekt. Testene tjekker at anonyme brugere kan det de skal
# og ikke mere: at visitor_key ikke kan læses, at der ikke kan skrives direkte
# i tabellerne, at rate limits og honeypot virker, og at admin-adgang kræver
# en e-mail på allowlisten.
#
#   supabase/tests/run.sh                        # bruger en kørende server
#   PGHOST=/var/run/postgresql supabase/tests/run.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

DB=${TEST_DB:-ideboard_test}
PSQL=(psql -v ON_ERROR_STOP=1 -q -U "${PGUSER:-postgres}")

"${PSQL[@]}" -d postgres -c "drop database if exists $DB;" -c "create database $DB;"

for f in supabase/tests/00_supabase_shim.sql \
         supabase/migrations/*.sql \
         supabase/seed.sql; do
  echo "→ $f"
  "${PSQL[@]}" -d "$DB" -f "$f" | grep -v '^$' || true
done

psql -v ON_ERROR_STOP=1 -U "${PGUSER:-postgres}" -d "$DB" -f supabase/tests/01_rls_and_rpc.sql 2>&1 |
  grep -E 'NOTICE|ERROR|^---|^===' |
  sed 's/^psql[^ ]*: NOTICE:  //;s/^psql[^ ]*: /FEJL /'
