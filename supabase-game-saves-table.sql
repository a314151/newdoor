-- 在Supabase中创建游戏存档表
CREATE TABLE IF NOT EXISTS game_saves (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  save_data JSONB NOT NULL,
  version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_game_saves_user ON game_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_game_saves_updated_at ON game_saves(updated_at DESC);

-- 添加唯一约束，确保每个用户只有一个存档
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_saves_user_unique ON game_saves(user_id);

-- 插入示例存档（可选）
INSERT INTO game_saves (id, user_id, save_data, version, created_at, updated_at)
VALUES 
('1', 'system', '{"version": "3.0.0", "timestamp": 1234567890, "stats": {"level": 1, "currentXp": 0, "nextLevelXp": 100, "baseAtk": 0, "savedHp": 20, "savedMp": 10, "summonStones": 0}, "profile": {"username": "系统测试", "avatarUrl": "https://api.dicebear.com/7.x/pixel-art/svg?seed=system", "title": "系统"}}', '3.0.0', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;