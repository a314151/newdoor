import { createClient } from '@supabase/supabase-js';

// --- 配置说明 ---
// 1. URL: 在左侧菜单点击 "Data API"，复制 Project URL (https://xxxx.supabase.co)
// 2. KEY: 在左侧菜单点击 "API Keys"，复制 Publishable Key (sb_publishable_xxxx)

// Helper to safely get env vars supporting both Node (process.env) and Vite (import.meta.env)
const getSafeEnv = (key: string): string | undefined => {
  try {
    // 1. Check Vite/Modern Browser Environment (Most likely on Vercel)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
    // 2. Check Standard Node/Process Environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`VITE_${key}`] || process.env[key];
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

// 部署/本地均建议用环境变量 VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY 配置；占位符仅避免 createClient 报错，实际请求需有效配置
const DEFAULT_URL = 'https://placeholder.supabase.co';
const DEFAULT_KEY = 'placeholder-key';

const SUPABASE_URL = getSafeEnv('SUPABASE_URL') || DEFAULT_URL;
const SUPABASE_ANON_KEY = getSafeEnv('SUPABASE_ANON_KEY') || DEFAULT_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if supabase is configured
export const isSupabaseConfigured = () => {
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY &&
           SUPABASE_URL !== 'https://placeholder.supabase.co' &&
           SUPABASE_ANON_KEY !== 'placeholder-key';
};