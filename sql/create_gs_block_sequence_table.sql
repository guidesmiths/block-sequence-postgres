CREATE TABLE IF NOT EXISTS gs_block_sequence (
    name VARCHAR(32) NOT NULL UNIQUE,
    value BIGINT NOT NULL,
    metadata TEXT NULL
);


