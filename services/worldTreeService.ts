import { WorldTreeProposal } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { generateImage } from './aiService';

class WorldTreeService {
  private static STORAGE_KEY = 'inf_world_tree_proposals';

  // 获取所有世界树提议
  static async getProposals(): Promise<WorldTreeProposal[]> {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('world_tree_proposals')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to get world tree proposals from Supabase:', error);
          // 回退到localStorage
          return this.getLocalProposals();
        }

        return data.map(item => ({
          id: item.id,
          userId: item.user_id,
          content: item.content,
          fruitShape: item.fruit_shape,
          isCompleted: item.is_completed,
          createdAt: new Date(item.created_at).getTime(),
          completedAt: item.completed_at ? new Date(item.completed_at).getTime() : undefined
        }));
      } else {
        // 使用localStorage作为回退
        return this.getLocalProposals();
      }
    } catch (error) {
      console.error('Failed to get world tree proposals:', error);
      return this.getLocalProposals();
    }
  }

  // 从localStorage获取提议（回退方案）
  private static getLocalProposals(): WorldTreeProposal[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get local world tree proposals:', error);
      return [];
    }
  }

  // 保存提议到localStorage（回退方案）
  private static saveLocalProposals(proposals: WorldTreeProposal[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(proposals));
    } catch (error) {
      console.error('Failed to save local world tree proposals:', error);
    }
  }

  // 添加新提议
  static async addProposal(userId: string, content: string): Promise<WorldTreeProposal> {
    // 生成果实形状描述
    const fruitShape = await this.generateFruitShape(content);

    const newProposal: WorldTreeProposal = {
      id: Date.now().toString(),
      userId,
      content,
      fruitShape,
      isCompleted: false,
      createdAt: Date.now()
    };

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('world_tree_proposals')
          .insert({
            id: newProposal.id,
            user_id: newProposal.userId,
            content: newProposal.content,
            fruit_shape: newProposal.fruitShape,
            is_completed: newProposal.isCompleted,
            created_at: new Date(newProposal.createdAt).toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to add world tree proposal to Supabase:', error);
          // 回退到localStorage
          this.addLocalProposal(newProposal);
        }
      } else {
        // 使用localStorage作为回退
        this.addLocalProposal(newProposal);
      }
    } catch (error) {
      console.error('Failed to add world tree proposal:', error);
      // 回退到localStorage
      this.addLocalProposal(newProposal);
    }

    return newProposal;
  }

  // 添加提议到localStorage（回退方案）
  private static addLocalProposal(proposal: WorldTreeProposal): void {
    const proposals = this.getLocalProposals();
    proposals.unshift(proposal);
    this.saveLocalProposals(proposals);
  }

  // 标记提议为已完成
  static async markAsCompleted(id: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('world_tree_proposals')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error('Failed to mark world tree proposal as completed in Supabase:', error);
          // 回退到localStorage
          this.markLocalAsCompleted(id);
        }
      } else {
        // 使用localStorage作为回退
        this.markLocalAsCompleted(id);
      }
    } catch (error) {
      console.error('Failed to mark world tree proposal as completed:', error);
      // 回退到localStorage
      this.markLocalAsCompleted(id);
    }
  }

  // 标记本地提议为已完成（回退方案）
  private static markLocalAsCompleted(id: string): void {
    const proposals = this.getLocalProposals();
    const updated = proposals.map(proposal => 
      proposal.id === id ? { ...proposal, isCompleted: true, completedAt: Date.now() } : proposal
    );
    this.saveLocalProposals(updated);
  }

  // 生成果实形状描述
  private static async generateFruitShape(content: string): Promise<string> {
    try {
      // 这里可以使用AI生成果实形状描述
      // 暂时返回一些预定义的形状
      const shapes = [
        '圆形，表面有绿色条纹',
        '心形，顶端有小尖',
        '星形，有五个尖角',
        '椭圆形，表面光滑',
        '不规则形状，有凸起的斑点'
      ];
      return shapes[Math.floor(Math.random() * shapes.length)];
    } catch (error) {
      console.error('Failed to generate fruit shape:', error);
      return '圆形';
    }
  }

  // 删除提议
  static async deleteProposal(id: string): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('world_tree_proposals')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Failed to delete world tree proposal from Supabase:', error);
          // 回退到localStorage
          this.deleteLocalProposal(id);
        }
      } else {
        // 使用localStorage作为回退
        this.deleteLocalProposal(id);
      }
    } catch (error) {
      console.error('Failed to delete world tree proposal:', error);
      // 回退到localStorage
      this.deleteLocalProposal(id);
    }
  }

  // 从localStorage删除提议（回退方案）
  private static deleteLocalProposal(id: string): void {
    const proposals = this.getLocalProposals();
    const updated = proposals.filter(proposal => proposal.id !== id);
    this.saveLocalProposals(updated);
  }
}

export default WorldTreeService;