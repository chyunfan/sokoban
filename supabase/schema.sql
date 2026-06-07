-- 推箱子游戏分数表
-- 在 Supabase SQL Editor 中运行此文件

CREATE TABLE IF NOT EXISTS sokoban_scores (
  id BIGSERIAL PRIMARY KEY,
  openid TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  levels_cleared INTEGER NOT NULL DEFAULT 0,
  total_moves INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 分数更新时自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sokoban_scores_updated_at ON sokoban_scores;
CREATE TRIGGER update_sokoban_scores_updated_at
BEFORE UPDATE ON sokoban_scores
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全（anon key 直连，用 RLS 保护）
ALTER TABLE sokoban_scores ENABLE ROW LEVEL SECURITY;

-- 任何人可以读取排行榜
DROP POLICY IF EXISTS "Anyone can read rankings" ON sokoban_scores;
CREATE POLICY "Anyone can read rankings" ON sokoban_scores
  FOR SELECT USING (true);

-- 前端 anon key 可以插入
DROP POLICY IF EXISTS "Anyone can insert scores" ON sokoban_scores;
CREATE POLICY "Anyone can insert scores" ON sokoban_scores
  FOR INSERT WITH CHECK (true);

-- 前端 anon key 可以更新
DROP POLICY IF EXISTS "Anyone can update scores" ON sokoban_scores;
CREATE POLICY "Anyone can update scores" ON sokoban_scores
  FOR UPDATE USING (true) WITH CHECK (true);

-- 索引（排行榜查询优化）
CREATE INDEX IF NOT EXISTS idx_sokoban_scores_score
  ON sokoban_scores(score DESC, total_moves ASC);
