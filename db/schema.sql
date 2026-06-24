-- VECTOR app: PostgreSQL schema
-- Replaces the single localStorage blob (key 'vektor_v3') with normalized tables.
-- See app1.html: initDB()/loadDB()/saveDB() for the data this replaces.

BEGIN;

CREATE TYPE skill_type AS ENUM ('M', 'T');  -- M = м'які навички, T = тверді навички

-- Generates the numeric suffix for new student ids ('ST-021', 'ST-022', ...).
-- Used by POST /api/students for atomic id allocation under concurrent requests.
CREATE SEQUENCE student_id_seq;

CREATE TABLE students (
    id          TEXT PRIMARY KEY,              -- e.g. 'ST-001' (kept as-is from existing data)
    name        TEXT NOT NULL,
    dob         DATE,
    gender      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
    id          SERIAL PRIMARY KEY,
    type        skill_type NOT NULL,
    code        TEXT NOT NULL,                 -- e.g. '6.1', '13'
    name        TEXT NOT NULL,
    sort_order  INT NOT NULL,
    UNIQUE (type, code)
);

CREATE TABLE protocols (
    id           SERIAL PRIMARY KEY,
    student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    day          INT NOT NULL CHECK (day BETWEEN 1 AND 5),
    absent       BOOLEAN NOT NULL DEFAULT false,
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, day)
);

CREATE INDEX idx_protocols_student ON protocols(student_id);

CREATE TABLE protocol_scores (
    protocol_id  INT NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
    skill_id     INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score        SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 3),
    PRIMARY KEY (protocol_id, skill_id)
);

CREATE TABLE recommendations (
    id          SERIAL PRIMARY KEY,
    type        skill_type NOT NULL,
    text        TEXT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Online course lesson-watched progress (replaces localStorage key 'vector_watched').
-- user_email is not FK'd to a users table here because the existing /api/login
-- user store's schema is not yet known to this migration; add the FK once it is.
CREATE TABLE lesson_progress (
    user_email  TEXT NOT NULL,
    lesson_id   INT NOT NULL,
    watched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_email, lesson_id)
);

COMMIT;
