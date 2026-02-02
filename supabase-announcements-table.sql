-- 在Supabase中创建公告表
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_is_read ON announcements(is_read);

-- 插入示例公告
INSERT INTO announcements (id, title, content, created_at, is_read)
VALUES 
('1', '欢迎使用无限之门', '欢迎加入无限之门游戏！这是一个充满冒险和惊喜的世界。', NOW() - INTERVAL '1 day', FALSE),
('2', '系统更新通知', '我们刚刚更新了游戏系统，添加了新的功能和修复了一些问题。', NOW() - INTERVAL '12 hours', FALSE)
ON CONFLICT (id) DO NOTHING;