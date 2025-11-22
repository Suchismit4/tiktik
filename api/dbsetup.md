-- -- -- -- -- -- -- ========== Table: admins ==========
-- -- -- -- -- -- -- Stores information about admin users who manage content and experiments
-- -- -- -- -- -- -- CREATE TABLE admins (
-- -- -- -- -- -- --     admin_id SERIAL PRIMARY KEY,
-- -- -- -- -- -- --     username TEXT UNIQUE NOT NULL, 
-- -- -- -- -- -- --     firebase_uid TEXT UNIQUE,      
-- -- -- -- -- -- --     created_at TIMESTAMPTZ DEFAULT NOW()
-- -- -- -- -- -- -- );

-- -- -- -- -- -- -- COMMENT ON TABLE admins IS 'Admin users who manage the platform, upload content, and set up experiments.';
-- -- -- -- -- -- -- COMMENT ON COLUMN admins.firebase_uid IS 'Firebase UID if admins use Firebase for authentication into an admin panel.';

-- -- -- -- -- -- -- ========== Table: app_users (Participants) ==========
-- -- -- -- -- -- -- Stores information about the participants (users) of the app, linked to Firebase.
-- -- -- -- -- -- CREATE TABLE app_users (
-- -- -- -- -- --     user_id SERIAL PRIMARY KEY,
-- -- -- -- -- --     firebase_uid TEXT UNIQUE NOT NULL,
-- -- -- -- -- --     created_at TIMESTAMPTZ DEFAULT NOW()
-- -- -- -- -- -- );

-- -- -- -- -- -- COMMENT ON TABLE app_users IS 'Participants in the research study, authenticated via Firebase.';

-- -- -- -- -- -- ========== Table: tags (Tag Definitions) ==========
-- -- -- -- -- -- Central repository for all tags that can be applied to content.
-- -- -- -- -- CREATE TABLE tags (
-- -- -- -- --     tag_id SERIAL PRIMARY KEY,
-- -- -- -- --     tag_name TEXT NOT NULL,
-- -- -- -- --     tag_category TEXT NOT NULL,        -- e.g., 'content_theme', 'visual_element', 'research_label_v1'
-- -- -- -- --     description TEXT,                  -- Detailed explanation of what the tag represents
-- -- -- -- --     created_by_admin_id INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL, -- Tracks which admin created the tag
-- -- -- -- --     created_at TIMESTAMPTZ DEFAULT NOW(),
-- -- -- -- --     CONSTRAINT unique_tag_in_category UNIQUE (tag_name, tag_category)
-- -- -- -- -- );

-- -- -- -- -- COMMENT ON TABLE tags IS 'Definitions of tags (keywords, labels) that can be applied to content items.';
-- -- -- -- -- COMMENT ON COLUMN tags.tag_category IS 'Category to group tags, e.g., genre, mood, research-specific.';
-- -- -- -- -- COMMENT ON COLUMN tags.created_by_admin_id IS 'Admin who defined this tag. Set to NULL if admin is deleted.';

-- -- -- -- -- ========== Table: content (Curated Videos) ==========
-- -- -- -- -- Stores information about each piece of video content. Content is uploaded and tagged by admins.
-- -- -- -- CREATE TABLE content (
-- -- -- --     content_id SERIAL PRIMARY KEY,
-- -- -- --     uploaded_by_admin_id INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL, -- Admin who uploaded/curated this content
-- -- -- --     video_url TEXT NOT NULL,           
-- -- -- --     thumbnail_url TEXT,
-- -- -- --     title TEXT,
-- -- -- --     description_caption TEXT,
-- -- -- --     duration_seconds INTEGER CHECK (duration_seconds > 0),
-- -- -- --     uploaded_at TIMESTAMPTZ DEFAULT NOW(),
-- -- -- --     custom_metadata JSONB,             -- For any other specific, non-relational attributes of the video
-- -- -- --     tag_ids INTEGER[]                  -- Array of tag_id references from the 'tags' table
-- -- -- -- );

-- -- -- -- COMMENT ON TABLE content IS 'Curated video content for the platform, managed by admins.';
-- -- -- -- COMMENT ON COLUMN content.uploaded_by_admin_id IS 'Admin who uploaded this content. Set to NULL if admin is deleted.';
-- -- -- -- COMMENT ON COLUMN content.tag_ids IS 'Array of foreign keys referencing tag_id from the tags table.';
-- -- -- -- CREATE INDEX idx_content_tag_ids ON content USING GIN (tag_ids);

-- -- -- -- ========== Table: experiments ==========
-- -- -- -- Defines and manages research experiments (A/B tests, surveys, etc.).
-- -- -- CREATE TABLE experiments (
-- -- --     experiment_id SERIAL PRIMARY KEY,
-- -- --     name TEXT NOT NULL UNIQUE,
-- -- --     description TEXT,
-- -- --     type TEXT,                         -- e.g., 'A/B_recommendation', 'survey_engagement'
-- -- --     status TEXT DEFAULT 'planning',    -- e.g., 'planning', 'active', 'paused', 'completed', 'archived'
-- -- --     config_details JSONB,              -- Experiment-specific settings (variant definitions, survey structure)
-- -- --     start_date TIMESTAMPTZ,
-- -- --     end_date TIMESTAMPTZ,
-- -- --     created_by_admin_id INTEGER REFERENCES admins(admin_id) ON DELETE SET NULL,
-- -- --     created_at TIMESTAMPTZ DEFAULT NOW(),
-- -- --     CONSTRAINT check_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
-- -- -- );

-- -- -- COMMENT ON TABLE experiments IS 'Definitions of research experiments conducted on the platform.';
-- -- -- COMMENT ON COLUMN experiments.config_details IS 'JSONB field for flexible experiment configurations, like A/B variants or survey questions.';
-- -- -- COMMENT ON COLUMN experiments.created_by_admin_id IS 'Admin who created this experiment. Set to NULL if admin is deleted.';

-- -- -- ========== Table: experiment_participants_bridge ==========
-- -- -- Links participants (app_users) to specific experiments and their assigned variant/group.
-- -- CREATE TABLE experiment_participants_bridge (
-- --     assignment_id SERIAL PRIMARY KEY,
-- --     experiment_id INTEGER NOT NULL REFERENCES experiments(experiment_id) ON DELETE CASCADE,
-- --     participant_user_id INTEGER NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
-- --     variant_assigned TEXT,             -- e.g., 'control_group', 'variant_A_new_algo'
-- --     assigned_at TIMESTAMPTZ DEFAULT NOW(),
-- --     status_in_experiment TEXT DEFAULT 'enrolled', -- e.g., 'enrolled', 'active_data_collection', 'completed', 'dropped'
-- --     CONSTRAINT unique_participant_in_experiment UNIQUE (experiment_id, participant_user_id)
-- -- );

-- -- COMMENT ON TABLE experiment_participants_bridge IS 'Links participants to experiments and their assigned variants/groups.';
-- -- COMMENT ON COLUMN experiment_participants_bridge.experiment_id IS 'Cascades delete: if experiment is deleted, participant assignments are removed.';
-- -- COMMENT ON COLUMN experiment_participants_bridge.participant_user_id IS 'Cascades delete: if participant is deleted, their assignments are removed.';

-- -- ========== Table: interaction_data ==========
-- -- Records participant interactions with content, features, or experiments.
-- CREATE TABLE interaction_data (
--     interaction_id BIGSERIAL PRIMARY KEY, -- BIGSERIAL for potentially high volume
--     assignment_id INTEGER NOT NULL REFERENCES experiment_participants_bridge(assignment_id) ON DELETE CASCADE, -- Links to specific participant in an experiment
--     content_id INTEGER REFERENCES content(content_id) ON DELETE SET NULL, -- If interaction is related to specific content
--     interaction_type TEXT NOT NULL,     -- e.g., 'video_view', 'like_content', 'survey_response', 'navigation_event'
--     interaction_timestamp TIMESTAMPTZ DEFAULT NOW(),
--     session_id TEXT,                    -- To group interactions within a single user session
--     payload JSONB                       -- Interaction-specific data (e.g., watch_duration, survey_answer)
-- );

-- COMMENT ON TABLE interaction_data IS 'Logs participant interactions with content, app features, or experiments.';
-- COMMENT ON COLUMN interaction_data.assignment_id IS 'Links to the participant''s specific assignment in an experiment. Cascades delete.';
-- COMMENT ON COLUMN interaction_data.content_id IS 'Content item related to the interaction. Set to NULL if content is deleted.';
-- COMMENT ON COLUMN interaction_data.payload IS 'Flexible JSONB field for detailed, type-specific interaction data.';

-- -- -- ========== Table: groups ==========
-- -- Stores information about each group and the types of content they view when chosen for an experiment.
-- CREATE TABLE groups (
--      group_id SERIAL PRIMARY KEY,
--      description TEXT,
--      max_participants INTEGER,
--      tag_ids INTEGER[],
--      status INTEGER NOT NULL
-- );