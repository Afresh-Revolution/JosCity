-- SQL Schema Script to Reset user_id Sequence
-- This script resets the user_id sequence counter to start from 1
-- 
-- Usage:
--   psql -U your_username -d your_database -f reset_user_id_sequence.sql
--   Or execute in your PostgreSQL client (pgAdmin, DBeaver, etc.)
--
-- WARNING: This will reset the sequence counter to start from 1. 
-- New users will get IDs starting from 1, which may conflict with existing records.
-- Only use this if you have deleted all existing user records or are starting fresh.

-- Method 1: Direct reset to 1 (recommended if table is empty or you've deleted all users)
-- Replace 'users_user_id_seq' with your actual sequence name if different
-- Common sequence names: users_user_id_seq, user_id_seq, users_id_seq

ALTER SEQUENCE users_user_id_seq RESTART WITH 1;

-- Method 2: Auto-detect and reset sequence (more robust)
-- This will find the sequence automatically based on the users table
-- Uncomment the block below if Method 1 doesn't work:

-- DO $$
-- DECLARE
--     seq_name TEXT;
-- BEGIN
--     -- Find the sequence name for user_id column in users table
--     SELECT pg_get_serial_sequence('users', 'user_id') INTO seq_name;
--     
--     IF seq_name IS NOT NULL THEN
--         EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';
--         RAISE NOTICE 'Sequence % reset to 1', seq_name;
--     ELSE
--         RAISE EXCEPTION 'Could not find sequence for users.user_id';
--     END IF;
-- END $$;

-- Method 3: Reset sequence based on current max user_id + 1
-- Use this if you want to continue from the highest existing ID (after deleting some users)
-- Uncomment the block below and comment out Method 1:

-- DO $$
-- DECLARE
--     max_id INTEGER;
--     seq_name TEXT;
-- BEGIN
--     SELECT pg_get_serial_sequence('users', 'user_id') INTO seq_name;
--     SELECT COALESCE(MAX(user_id), 0) INTO max_id FROM users;
--     
--     IF seq_name IS NOT NULL THEN
--         EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH ' || (max_id + 1);
--         RAISE NOTICE 'Sequence % reset to %', seq_name, max_id + 1;
--     ELSE
--         RAISE EXCEPTION 'Could not find sequence for users.user_id';
--     END IF;
-- END $$;

-- Verification queries (run after executing the script):

-- Check current sequence value:
-- SELECT last_value FROM users_user_id_seq;

-- Get next value (will return 1 if reset was successful):
-- SELECT nextval('users_user_id_seq');

-- Find all sequences related to users table:
-- SELECT sequence_name 
-- FROM information_schema.sequences 
-- WHERE sequence_name LIKE '%user%';

-- Alternative: Find sequence for a specific column:
-- SELECT pg_get_serial_sequence('users', 'user_id');

