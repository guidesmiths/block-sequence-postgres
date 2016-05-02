UPDATE gs_block_sequence SET value = value + $2 WHERE name = $1 RETURNING *;
