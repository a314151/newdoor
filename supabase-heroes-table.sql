-- 在Supabase中创建全局英雄表，用于存储所有玩家生成的英雄
CREATE TABLE IF NOT EXISTS global_heroes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  visual_style TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  creator_user_id TEXT NOT NULL,  -- 记录创建者的用户ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建全局英雄技能表
CREATE TABLE IF NOT EXISTS global_hero_skills (
  id SERIAL PRIMARY KEY,
  hero_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,  -- ATTACK, DEFENSE, HEAL, BUFF, DEBUFF, ULTIMATE
  mp_cost INTEGER NOT NULL,
  power INTEGER NOT NULL,
  FOREIGN KEY (hero_id) REFERENCES global_heroes(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_global_heroes_created_at ON global_heroes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_heroes_creator ON global_heroes(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_global_hero_skills_hero ON global_hero_skills(hero_id);

-- 插入默认英雄
INSERT INTO global_heroes (id, name, title, description, image_url, is_default, creator_user_id)
VALUES 
('default_adventurer', '冒险家', '初出茅庐', '一位渴望未知的普通冒险者。', 'https://placehold.co/512x512/334155/e2e8f0?text=Adventurer', true, 'system')
ON CONFLICT (id) DO NOTHING;

-- 为默认英雄添加技能
INSERT INTO global_hero_skills (hero_id, name, description, type, mp_cost, power)
VALUES 
('default_adventurer', '重击', '用力挥舞武器', 'ATTACK', 3, 3),
('default_adventurer', '孤注一掷', '消耗大量体力的强力一击', 'ULTIMATE', 8, 7)
ON CONFLICT DO NOTHING;
