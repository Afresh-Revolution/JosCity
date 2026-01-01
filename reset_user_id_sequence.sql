-- ============================================
-- Reset user_id sequence to start from 1
-- ============================================

-- OPTION 1: Reset sequence WITHOUT deleting existing data
-- This will set the sequence to start from 1, but existing records keep their current IDs
-- WARNING: This can cause conflicts if you try to insert new records!
-- Use this only if you've deleted all existing users or are starting fresh

-- First, find the current maximum user_id
-- SELECT MAX(user_id) FROM users;

-- Reset the sequence to start from 1 (or next available number)
-- Replace 'users_user_id_seq' with your actual sequence name if different
ALTER SEQUENCE users_user_id_seq RESTART WITH 1;

-- OR use setval (alternative method)
-- SELECT setval('users_user_id_seq', 1, false);


-- ============================================
-- OPTION 2: Delete all users and reset sequence (CLEAN SLATE)
-- ============================================
-- WARNING: This will DELETE ALL USER DATA! Use with extreme caution!

-- Step 1: Delete all users (or truncate the table)
-- TRUNCATE TABLE users CASCADE;  -- CASCADE removes dependent records too
-- OR
-- DELETE FROM users;

-- Step 2: Reset the sequence
-- ALTER SEQUENCE users_user_id_seq RESTART WITH 1;


-- ============================================
-- OPTION 3: Reset to start after existing max ID (SAFER)
-- ============================================
-- This ensures new IDs start after the highest existing ID

-- Reset sequence to start from the next number after max existing ID
SELECT setval('users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM users), 0) + 1, false);


-- ============================================
-- How to find your sequence name:
-- ============================================
-- Run this query to find the sequence name for user_id:
-- SELECT 
--     sequence_name
-- FROM 
--     information_schema.sequences
-- WHERE 
--     sequence_name LIKE '%user%id%';

-- Or check the table definition:
-- SELECT 
--     column_name, 
--     column_default
-- FROM 
--     information_schema.columns
-- WHERE 
--     table_name = 'users' 
--     AND column_name = 'user_id';

