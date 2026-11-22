CREATE TABLE IF NOT EXISTS scores (
  game TEXT NOT NULL,
  player_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000000000),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (game, player_hash)
);
CREATE INDEX IF NOT EXISTS scores_ranking ON scores(game, score DESC, created_at ASC, player_hash ASC);
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  player_hash TEXT NOT NULL,
  digest TEXT NOT NULL,
  game TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS submissions_expiry ON submissions(created_at);
