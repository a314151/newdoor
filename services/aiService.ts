
import { GoogleGenAI, Type } from "@google/genai";
import { ThemeConfig, AIConfig, AIProvider, Hero, HeroSkill, SkillType } from "../types";
import { getDiscussionSystemPrompt, getDiscussionUserPrompt } from "./prompts";

// --- Helpers ---

const cleanJson = (text: string): string => {
  if (!text) return "{}";
  
  let cleaned = text;
  
  // 1. Remove DeepSeek reasoning traces <think>...</think> (Global, multiline, dotall equivalent)
  // Using [\s\S] to match newlines within the tag
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // 2. Try to parse directly first (Best case scenario)
  try {
      JSON.parse(cleaned);
      return cleaned;
  } catch (e) {
      // Continue cleaning
  }

  // 3. Extract JSON from Markdown code blocks if present
  const markdownJsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownJsonMatch) {
      cleaned = markdownJsonMatch[1].trim();
  }

  // 4. Locate the outermost JSON object or array
  // This helps when there is text before or after the JSON/Markdown block
  const firstOpenBrace = cleaned.indexOf('{');
  const firstOpenBracket = cleaned.indexOf('[');
  
  let startIndex = -1;
  let endIndex = -1;

  // Determine start index (whichever comes first)
  if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
      startIndex = firstOpenBrace;
      // Look for the last matching closing brace
      // Simple lastIndexOf is usually sufficient for valid JSON response
      endIndex = cleaned.lastIndexOf('}');
  } else if (firstOpenBracket !== -1) {
      startIndex = firstOpenBracket;
      endIndex = cleaned.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
  }
  
  return cleaned.trim();
};

export const getPlaceholderImage = (text: string, bgColor: string = '1e293b') => {
  return `https://placehold.co/512x512/${bgColor}/e2e8f0?text=${encodeURIComponent(text.substring(0, 10))}`;
};

// --- Common Handler ---
const handleAiRequest = async (config: AIConfig, systemPrompt: string, userPrompt: string, schema?: any): Promise<any> => {
    if (config.provider === AIProvider.GEMINI) {
        const ai = new GoogleGenAI({ apiKey: config.apiKey });
        const geminiConfig: any = {
            systemInstruction: systemPrompt,
            temperature: 1,
        };
        
        if (schema) {
            geminiConfig.responseMimeType = "application/json";
            geminiConfig.responseSchema = schema;
        }

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: userPrompt,
                config: geminiConfig
            });
            
            const text = response.text || "";
            return schema ? JSON.parse(cleanJson(text)) : text;
        } catch (e) {
            console.error("Gemini Request Error:", e);
            throw e;
        }
    } else {
        // Fallback for DeepSeek/Zhipu
        
        let url = "";
        let model = "";

        if (config.provider === AIProvider.DEEPSEEK) {
            // Default to official API if no baseUrl provided
            let baseUrl = config.baseUrl || "https://api.deepseek.com";
            
            // Remove trailing slash
            baseUrl = baseUrl.replace(/\/$/, '');

            // Auto-append path if missing
            if (!baseUrl.includes('/chat/completions')) {
                // If user put 'https://api.deepseek.com/v1', we append '/chat/completions'
                // If user put 'https://api.deepseek.com', we append '/chat/completions'
                url = `${baseUrl}/chat/completions`;
            } else {
                url = baseUrl;
            }

            // Use configured model or default to 'deepseek-chat' (faster)
            model = config.model || "deepseek-chat"; 

        } else if (config.provider === AIProvider.ZHIPU) {
             url = config.baseUrl || "https://open.bigmodel.cn/api/paas/v4/chat/completions";
             model = "glm-4-flash";
        }
        
        // CRITICAL: Inject Schema for non-Gemini models to ensure JSON structure
        let finalSystemPrompt = systemPrompt;
        if (schema) {
            finalSystemPrompt += `\n\n【必须严格遵守】请只返回纯净的JSON格式数据，不要包含Markdown代码块(\`\`\`)，不要包含<think>标签，不要包含任何解释性文字。\nJSON结构定义:\n${JSON.stringify(schema, null, 2)}`;
        }

        try {
            const r = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: finalSystemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    stream: false,
                    // For DeepSeek V3, setting response_format to json_object helps stability
                    response_format: schema ? { type: "json_object" } : undefined
                })
            });
            
            if (!r.ok) {
                const errText = await r.text();
                // Check specifically for CORS-like errors or 401s to give better feedback
                throw new Error(`API Request Failed. Status: ${r.status}. Msg: ${errText.substring(0, 100)}... (请检查Base URL或跨域设置)`);
            }

            const d = await r.json();
            let content = d.choices?.[0]?.message?.content || "";
            
            return schema ? JSON.parse(cleanJson(content)) : content;
        } catch (e) {
            console.error("AI Provider Error:", e);
            throw e;
        }
    }
};

// --- Logic ---

export const generateStoryOptions = async (config: AIConfig): Promise<string[]> => {
  const prompt = `请构思3个完全不同、脑洞大开且意想不到的Roguelike游戏世界观主题。
  
  要求：
  1. 拒绝平庸。尝试混搭、超现实、幽默、微观世界或极度黑暗的风格。
  2. 这三个选项必须风格迥异。
  3. 返回包含 'themes' 数组的 JSON 对象。`;
  
  try {
      const schema = {
          type: Type.OBJECT,
          properties: {
              themes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
              }
          },
          required: ["themes"]
      };

      const response = await handleAiRequest(config, "你是一个创意总监。", prompt, schema);

      if (response && Array.isArray(response.themes)) {
          return response.themes.map((item: any) => String(item));
      }
      
      throw new Error("AI did not return a themes array");
  } catch (e) {
      console.error("Story Gen Error", e);
      return ["赛博朋克深渊", "被遗忘的玩具工厂", "古代炼金术士的高塔"];
  }
};

export const generateTheme = async (config: AIConfig, storyContext?: string, isFinalLevel: boolean = false): Promise<ThemeConfig> => {
  let systemPrompt = `你是一位游戏设计师。生成一个Roguelike地牢爬行游戏主题配置JSON。
  
  配置要求：
  1. themeTitle: 主题名称。
  2. flavorText: 一句氛围描述。
  3. enemies: 一个数组，包含至少3种不同的敌人，每种有 name 和 description。
  4. bossName: 本关BOSS名称。
  5. keyItemName: 通关钥匙名称。
  6. exitName: 出口名称。
  7. itemNames: 对象，包含 hp (治疗物品名), mp (回蓝物品名), xp (经验书名)。
  8. skills: 对象，包含 attack (普攻名), defend (防御名), special (大招名)。
  9. visualStyle: 用于生成背景图的英文提示词。
  `;

  if (storyContext) systemPrompt += `\n当前剧情上下文："${storyContext}"\n请衔接剧情。`;
  if (isFinalLevel) systemPrompt += `\n这是最终决战！Boss和环境要极其压抑或宏大。`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      themeTitle: { type: Type.STRING },
      flavorText: { type: Type.STRING },
      visualStyle: { type: Type.STRING },
      enemies: { 
          type: Type.ARRAY, 
          items: { 
              type: Type.OBJECT, 
              properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
              required: ["name", "description"] 
          } 
      },
      bossName: { type: Type.STRING },
      keyItemName: { type: Type.STRING },
      exitName: { type: Type.STRING },
      itemNames: { type: Type.OBJECT, properties: { hp: { type: Type.STRING }, mp: { type: Type.STRING }, xp: { type: Type.STRING } }, required: ["hp", "mp", "xp"] },
      skills: { type: Type.OBJECT, properties: { attack: { type: Type.STRING }, defend: { type: Type.STRING }, special: { type: Type.STRING } }, required: ["attack", "defend", "special"] }
    },
    required: ["themeTitle", "flavorText", "enemies", "bossName", "keyItemName", "exitName", "itemNames", "skills", "visualStyle"]
  };

  return await handleAiRequest(config, systemPrompt, "生成主题配置", schema);
};

export const generateHero = async (config: AIConfig, heroName: string): Promise<Hero> => {
    const systemPrompt = `你是一个角色设计师。用户会输入一个角色名称（可能是虚构、历史或神话人物）。
    你需要分析这个名字，设计一个可以在RPG游戏中使用的英雄JSON。
    
    输出JSON结构要求：
    1. name: 角色名。
    2. title: 一个响亮的称号 (如 "齐天大圣")。
    3. description: 50字以内的背景介绍。
    4. visualStyle: 用于生成像素头像的英文提示词 (e.g. "pixel art face of Sun Wukong, golden armor").
    5. skills: 包含2个技能的数组。每个技能包含 name, description, type (ATTACK/HEAL/BUFF/ULTIMATE), mpCost (数值), power (数值1-10)。
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            visualStyle: { type: Type.STRING },
            skills: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["ATTACK", "HEAL", "BUFF", "ULTIMATE"] },
                        mpCost: { type: Type.NUMBER },
                        power: { type: Type.NUMBER }
                    },
                    required: ["name", "description", "type", "mpCost", "power"]
                }
            }
        },
        required: ["name", "title", "description", "skills", "visualStyle"]
    };

    const heroData = await handleAiRequest(config, systemPrompt, `设计英雄：${heroName}`, schema);
    const rawSkills = Array.isArray(heroData?.skills) ? heroData.skills : [];
    const validTypes = ['ATTACK', 'HEAL', 'BUFF', 'ULTIMATE'] as const;
    const skills: HeroSkill[] = rawSkills.slice(0, 4).map((s: any) => ({
        name: String(s?.name ?? '技能'),
        description: String(s?.description ?? ''),
        type: (validTypes.includes(s?.type) ? s.type : 'ATTACK') as SkillType,
        mpCost: Number(s?.mpCost) ?? 0,
        power: Number(s?.power) ?? 5
    }));
    return {
        id: Date.now().toString(),
        name: heroData?.name ?? '英雄',
        title: heroData?.title ?? '',
        description: heroData?.description ?? '',
        imageUrl: heroData?.imageUrl ?? getPlaceholderImage(heroData?.name ?? heroName, '334155'),
        skills: skills.length >= 1 ? skills : [{ name: '普攻', description: '基础攻击', type: SkillType.ATTACK, mpCost: 0, power: 3 }],
        visualStyle: heroData?.visualStyle
    };
};

export const generateImage = async (config: AIConfig, prompt: string, isPixelArt: boolean = true): Promise<string> => {
  const refinedPrompt = isPixelArt 
    ? `Pixel art style, 16-bit retro game asset, isolated on black background: ${prompt}`
    : prompt;

  if (config.provider === AIProvider.GEMINI) {
      try {
        const ai = new GoogleGenAI({ apiKey: config.apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: refinedPrompt }] },
            config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } catch(e) {}
  } else if (config.provider === AIProvider.ZHIPU) {
      try {
        const r = await fetch("https://open.bigmodel.cn/api/paas/v4/images/generations", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.apiKey}` },
            body: JSON.stringify({ model: "cogview-3-plus", prompt: refinedPrompt, size: "1024x1024" })
        });
        const d = await r.json();
        const url = d?.data?.[0]?.url;
        if (url) return url;
      } catch (e) {}
  }
  return getPlaceholderImage(prompt.split(',')[0].replace('Pixel art style', '').trim());
};

export const generateLevelNarrative = async (config: AIConfig, worldTitle: string, chapterTitle: string, events: string[]): Promise<string> => {
    const prompt = `背景：${worldTitle}，章节：${chapterTitle}。
    事件：${events.join(', ')}。
    请写一段200字的第一人称冒险日记，要有代入感。`;
    return await handleAiRequest(config, "你是一个小说家。", prompt);
};

export const generateFullStory = async (config: AIConfig, worldTitle: string, summaries: string[]): Promise<string> => {
    const prompt = `
    任务：基于以下冒险片段，创作一篇连贯的“微小说”。
    
    世界观：${worldTitle}
    素材片段：
    ${summaries.join('\n')}
    
    要求：
    1. 不要只是机械地拼接日记。
    2. 重新组织语言，使其读起来像一篇结构完整的短篇小说（起因、经过、高潮、结局）。
    3. 重点描写英雄的心路历程和最终的胜利。
    4. 字数控制在${Math.max(500, summaries.length * 150)}字左右。
    `;
    return await handleAiRequest(config, "你是一个获得雨果奖的科幻/奇幻小说家。", prompt);
};

export interface DialogueResponse {
    monsterText: string;
    options: string[];
    isFinished: boolean;
}

export const generateDialogue = async (
    config: AIConfig, 
    hero: Hero, 
    theme: ThemeConfig, 
    history: { role: string, content: string }[], 
    round: number
): Promise<DialogueResponse> => {
    
    // Import system prompt from modular file
    const systemPrompt = getDiscussionSystemPrompt(theme, hero, round);
    const userPrompt = getDiscussionUserPrompt(history, hero.name);
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            monsterText: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            isFinished: { type: Type.BOOLEAN }
        },
        required: ["monsterText", "options", "isFinished"]
    };

    return await handleAiRequest(config, systemPrompt, userPrompt, schema);
};
