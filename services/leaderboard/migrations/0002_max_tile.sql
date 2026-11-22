ALTER TABLE scores ADD COLUMN max_tile INTEGER
  CHECK (max_tile IS NULL OR (max_tile >= 2 AND max_tile <= 1073741824 AND (max_tile & (max_tile - 1)) = 0));
