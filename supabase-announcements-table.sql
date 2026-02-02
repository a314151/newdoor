-- 在Supabase中创建公告表（移除is_read字段，改为每个用户单独记录）
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户公告阅读状态表
CREATE TABLE IF NOT EXISTS user_announcement_read (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  announcement_id TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  UNIQUE(user_id, announcement_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_announcement_user ON user_announcement_read(user_id);
CREATE INDEX IF NOT EXISTS idx_user_announcement_announcement ON user_announcement_read(announcement_id);
CREATE INDEX IF NOT EXISTS idx_user_announcement_read_status ON user_announcement_read(is_read);

-- 插入示例公告
INSERT INTO announcements (id, title, content, created_at)
VALUES 
('1', '欢迎使用无限之门', '欢迎加入无限之门游戏！这是一个充满冒险和惊喜的世界。', NOW() - INTERVAL '1 day'),
('2', '系统更新通知', '我们刚刚更新了游戏系统，添加了新的功能和修复了一些问题。', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;