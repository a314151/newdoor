-- 在Supabase中创建世界树提议表
CREATE TABLE IF NOT EXISTS world_tree_proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  fruit_shape TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_world_tree_created_at ON world_tree_proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_world_tree_user ON world_tree_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_world_tree_completed ON world_tree_proposals(is_completed);

-- 插入示例提议
INSERT INTO world_tree_proposals (id, user_id, content, fruit_shape, is_completed, created_at)
VALUES 
('1', 'system', '添加更多的英雄技能', '圆形，表面有绿色条纹', false, NOW() - INTERVAL '1 day'),
('2', 'system', '增加新的游戏模式', '心形，顶端有小尖', false, NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;