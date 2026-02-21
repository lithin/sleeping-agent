CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  amount INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
