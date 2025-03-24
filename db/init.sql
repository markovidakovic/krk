CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Processing', 'Failed', 'Successful')),
    processed_path TEXT,
    processing_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);