-- A course has modules; a module has lessons; a lesson is one page. Rename "pages" to "lessons" everywhere.
ALTER TABLE pages RENAME TO lessons;
ALTER TABLE lessons RENAME CONSTRAINT pages_pkey TO lessons_pkey;
ALTER TABLE lessons RENAME CONSTRAINT pages_module_id_fkey TO lessons_module_id_fkey;
ALTER INDEX pages_module_position_idx RENAME TO lessons_module_position_idx;

ALTER TABLE user_page_progress RENAME TO user_lesson_progress;
ALTER TABLE user_lesson_progress RENAME COLUMN page_id TO lesson_id;
ALTER TABLE user_lesson_progress RENAME CONSTRAINT user_page_progress_pkey TO user_lesson_progress_pkey;
ALTER TABLE user_lesson_progress RENAME CONSTRAINT user_page_progress_user_id_fkey TO user_lesson_progress_user_id_fkey;
ALTER TABLE user_lesson_progress RENAME CONSTRAINT user_page_progress_page_id_fkey TO user_lesson_progress_lesson_id_fkey;
ALTER INDEX user_page_progress_completed_idx RENAME TO user_lesson_progress_completed_idx;

ALTER TABLE user_course_state RENAME COLUMN last_page_id TO last_lesson_id;
ALTER TABLE user_course_state RENAME CONSTRAINT user_course_state_last_page_id_fkey TO user_course_state_last_lesson_id_fkey;

-- Only confirmed courses live in the catalog (Replit 101 today). Unconfirmed courses had no learner progress.
DELETE FROM lessons WHERE module_id IN (SELECT m.id FROM modules m JOIN courses c ON c.id = m.course_id WHERE NOT c.published);
DELETE FROM modules WHERE course_id IN (SELECT id FROM courses WHERE NOT published);
DELETE FROM courses WHERE NOT published;
