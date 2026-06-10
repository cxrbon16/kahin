-- Kâhin — FULL RESET. Wipes all game data, then re-seed with seed.sql.
-- WARNING: irreversible. Run in Supabase SQL Editor.
-- Order: child/data tables first, then re-init the results singleton.

-- 1. Player predictions
truncate table predictions;

-- 2. Teams (re-seeded by seed.sql afterwards)
truncate table teams;

-- 3. Results singleton -> back to empty
delete from results;
insert into results (id) values (1);

-- 4. Profiles (display names). Removing these does NOT delete the login
--    accounts in auth.users; see note below.
truncate table profiles;

-- ---------------------------------------------------------------------------
-- OPTIONAL: also delete the actual login accounts (auth.users).
-- Only run this if you want people to sign up again from scratch.
-- The handle_new_user trigger recreates a profile on next signup.
-- ---------------------------------------------------------------------------
-- delete from auth.users;
