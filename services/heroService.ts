import { Hero } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

class HeroService {
  // 保存英雄到全局英雄表
  static async saveHeroToGlobal(hero: Hero, creatorUserId: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        // 插入英雄基本信息
        const { error: heroError } = await supabase
          .from('global_heroes')
          .insert({
            id: hero.id,
            name: hero.name,
            title: hero.title,
            description: hero.description,
            image_url: hero.imageUrl,
            visual_style: hero.visualStyle,
            is_default: hero.isDefault,
            creator_user_id: creatorUserId
          })
          .onConflict('id')
          .ignore();

        if (heroError) {
          console.error('Failed to insert hero:', heroError);
          return;
        }

        // 插入英雄技能
        for (const skill of hero.skills) {
          const { error: skillError } = await supabase
            .from('global_hero_skills')
            .insert({
              hero_id: hero.id,
              name: skill.name,
              description: skill.description,
              type: skill.type,
              mp_cost: skill.mpCost,
              power: skill.power
            });

          if (skillError) {
            console.error('Failed to insert skill:', skillError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save hero to global table:', error);
    }
  }

  // 获取所有全局英雄
  static async getGlobalHeroes(): Promise<Hero[]> {
    try {
      if (isSupabaseConfigured()) {
        // 获取所有英雄基本信息
        const { data: heroes, error: heroError } = await supabase
          .from('global_heroes')
          .select('*')
          .order('created_at', { ascending: false });

        if (heroError) {
          console.error('Failed to get global heroes:', heroError);
          return [];
        }

        // 获取所有英雄技能
        const { data: skills, error: skillError } = await supabase
          .from('global_hero_skills')
          .select('*');

        if (skillError) {
          console.error('Failed to get global hero skills:', skillError);
          return [];
        }

        // 按英雄ID组织技能
        const skillsByHero = skills.reduce((acc, skill) => {
          if (!acc[skill.hero_id]) {
            acc[skill.hero_id] = [];
          }
          acc[skill.hero_id].push({
            name: skill.name,
            description: skill.description,
            type: skill.type,
            mpCost: skill.mp_cost,
            power: skill.power
          });
          return acc;
        }, {} as Record<string, any[]>);

        // 构建完整的英雄对象
        return heroes.map(hero => ({
          id: hero.id,
          name: hero.name,
          title: hero.title,
          description: hero.description,
          imageUrl: hero.image_url,
          visualStyle: hero.visual_style,
          isDefault: hero.is_default,
          creator_user_id: hero.creator_user_id,
          skills: skillsByHero[hero.id] || []
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get global heroes:', error);
      return [];
    }
  }

  // 根据创建者获取英雄
  static async getHeroesByCreator(creatorUserId: string): Promise<Hero[]> {
    try {
      if (isSupabaseConfigured()) {
        // 获取指定创建者的英雄基本信息
        const { data: heroes, error: heroError } = await supabase
          .from('global_heroes')
          .select('*')
          .eq('creator_user_id', creatorUserId)
          .order('created_at', { ascending: false });

        if (heroError) {
          console.error('Failed to get heroes by creator:', heroError);
          return [];
        }

        // 获取这些英雄的技能
        const heroIds = heroes.map(hero => hero.id);
        const { data: skills, error: skillError } = await supabase
          .from('global_hero_skills')
          .select('*')
          .in('hero_id', heroIds);

        if (skillError) {
          console.error('Failed to get hero skills:', skillError);
          return [];
        }

        // 按英雄ID组织技能
        const skillsByHero = skills.reduce((acc, skill) => {
          if (!acc[skill.hero_id]) {
            acc[skill.hero_id] = [];
          }
          acc[skill.hero_id].push({
            name: skill.name,
            description: skill.description,
            type: skill.type,
            mpCost: skill.mp_cost,
            power: skill.power
          });
          return acc;
        }, {} as Record<string, any[]>);

        // 构建完整的英雄对象
        return heroes.map(hero => ({
          id: hero.id,
          name: hero.name,
          title: hero.title,
          description: hero.description,
          imageUrl: hero.image_url,
          visualStyle: hero.visual_style,
          isDefault: hero.is_default,
          creator_user_id: hero.creator_user_id,
          skills: skillsByHero[hero.id] || []
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get heroes by creator:', error);
      return [];
    }
  }

  // 删除全局英雄
  static async deleteGlobalHero(heroId: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('global_heroes')
          .delete()
          .eq('id', heroId);

        if (error) {
          console.error('Failed to delete global hero:', error);
        }
      }
    } catch (error) {
      console.error('Failed to delete global hero:', error);
    }
  }
}

export default HeroService;