-- Hostel-10-only scoping migration.
-- Full backup taken before running: db-backups/hostel_db_pre_hostel10_migration_*.sql
--
-- Context: only hostel id=14 ("Hostel 10", code H10) has any real data
-- (4 students on block_id 27="10A" / 28="10B"). The other 13 seeded hostels
-- have zero users and zero complaints. assigned_hostel_id/assigned_block_id
-- are NULL for every staff member and were never read by any query, so
-- they're dropped outright with no data-loss risk.

-- 1. Add the new `block` enum columns (nullable — most existing rows have
--    no block on record, same as before).
ALTER TABLE users ADD COLUMN block ENUM('A','B') NULL AFTER room_number;
ALTER TABLE complaints ADD COLUMN block ENUM('A','B') NULL AFTER hostel_id;

-- 2. Migrate the only real data: the 4 Hostel-10 students.
UPDATE users SET block = 'A' WHERE block_id = 27;
UPDATE users SET block = 'B' WHERE block_id = 28;
-- (complaints.block_id is NULL on every existing row — nothing to migrate)

-- 3. Drop the foreign keys that reference blocks/hostels.
ALTER TABLE users DROP FOREIGN KEY FKd97glkhqku90x58a27s2rqr7t; -- block_id
ALTER TABLE users DROP FOREIGN KEY FKi0s2ucrdyo9suh8lvu651tmaa; -- assigned_hostel_id
ALTER TABLE users DROP FOREIGN KEY FKjr3kwdtp4r8e30h16o37al9as; -- assigned_block_id
ALTER TABLE users DROP FOREIGN KEY FKogsy6nsqsmjh0qh2tg0pk0ml7; -- hostel_id
ALTER TABLE complaints DROP FOREIGN KEY FKlayxljap1s5h8shmgp1yeopyj; -- hostel_id
ALTER TABLE complaints DROP FOREIGN KEY FKo9cw9huq39pwblgifwh03sfd4; -- block_id
ALTER TABLE blocks DROP FOREIGN KEY FKjqy2uiolbnu3dnble2bv51096; -- hostel_id

-- 4. Drop the now-obsolete columns (and their indexes, which MySQL drops
--    automatically along with the column/FK).
ALTER TABLE users
  DROP COLUMN hostel_id,
  DROP COLUMN block_id,
  DROP COLUMN assigned_hostel_id,
  DROP COLUMN assigned_block_id;

ALTER TABLE complaints
  DROP COLUMN hostel_id,
  DROP COLUMN block_id;

-- 5. Drop the now-empty-of-purpose tables.
DROP TABLE blocks;
DROP TABLE hostels;
