WITH new_row AS (
    INSERT INTO gs_block_sequence (name, value, metadata)
    SELECT * FROM (VALUES($1, CAST($2 AS BIGINT), $3)) AS values
    WHERE NOT EXISTS(
        SELECT name FROM gs_block_sequence WHERE name = $1
    ) RETURNING *
)
SELECT * FROM new_row
UNION
SELECT * FROM gs_block_sequence WHERE name = $1;