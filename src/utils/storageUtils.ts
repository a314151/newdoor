import { PlayerStats, UserProfile, Item, StoryLog, StoryCampaign, Hero, Email } from '../../types';

const DATA_VERSION = "3.0.0";

export const loadLocalData = () => {
  const savedStats = localStorage.getItem('inf_stats');
  const savedProfile = localStorage.getItem('inf_profile');
  const savedInv = localStorage.getItem('inf_inv');
  const savedHist = localStorage.getItem('inf_hist');
  const savedFail = localStorage.getItem('inf_fail');
  const savedStories = localStorage.getItem('inf_stories');
  const savedImageSetting = localStorage.getItem('inf_use_ai_images');
  const savedHeroes = localStorage.getItem('inf_heroes');
  const savedActiveHero = localStorage.getItem('inf_active_hero');

  return {
    stats: savedStats ? JSON.parse(savedStats) : null,
    profile: savedProfile ? JSON.parse(savedProfile) : null,
    inventory: savedInv ? JSON.parse(savedInv) : null,
    history: savedHist ? JSON.parse(savedHist) : null,
    failedLevels: savedFail ? JSON.parse(savedFail) : null,
    stories: savedStories ? JSON.parse(savedStories) : null,
    useAiImages: savedImageSetting !== null ? JSON.parse(savedImageSetting) : true,
    heroes: savedHeroes ? JSON.parse(savedHeroes) : null,
    activeHeroId: savedActiveHero || null
  };
};

export const saveLocalData = (data: {
  stats?: PlayerStats;
  profile?: UserProfile;
  inventory?: Item[];
  history?: StoryLog[];
  failedLevels?: any[];
  stories?: StoryCampaign[];
  useAiImages?: boolean;
  heroes?: Hero[];
  activeHeroId?: string;
}) => {
  if (data.stats) localStorage.setItem('inf_stats', JSON.stringify(data.stats));
  if (data.profile) localStorage.setItem('inf_profile', JSON.stringify(data.profile));
  if (data.inventory) localStorage.setItem('inf_inv', JSON.stringify(data.inventory));
  if (data.history) localStorage.setItem('inf_hist', JSON.stringify(data.history));
  if (data.failedLevels) localStorage.setItem('inf_fail', JSON.stringify(data.failedLevels));
  if (data.stories) localStorage.setItem('inf_stories', JSON.stringify(data.stories));
  if (data.useAiImages !== undefined) localStorage.setItem('inf_use_ai_images', JSON.stringify(data.useAiImages));
  if (data.heroes) localStorage.setItem('inf_heroes', JSON.stringify(data.heroes));
  if (data.activeHeroId) localStorage.setItem('inf_active_hero', data.activeHeroId);
};

export const loadEmails = (userId: string | null) => {
  const id = userId || 'guest';
  const emailsKey = `inf_emails_${id}`;
  const savedEmails = localStorage.getItem(emailsKey);
  return savedEmails ? JSON.parse(savedEmails) : [];
};

export const saveEmails = (userId: string | null, emails: Email[]) => {
  const id = userId || 'guest';
  const emailsKey = `inf_emails_${id}`;
  localStorage.setItem(emailsKey, JSON.stringify(emails));
};

export const hasInitialEmails = (userId: string | null) => {
  const id = userId || 'guest';
  const hasInitialEmailsKey = `inf_has_initial_emails_${id}`;
  return localStorage.getItem(hasInitialEmailsKey) === 'true';
};

export const markInitialEmailsSent = (userId: string | null) => {
  const id = userId || 'guest';
  const hasInitialEmailsKey = `inf_has_initial_emails_${id}`;
  localStorage.setItem(hasInitialEmailsKey, 'true');
};

export const resetLocalData = () => {
  const savedProvider = localStorage.getItem('ai_provider');
  const savedKey = localStorage.getItem('ai_key');
  const savedBaseUrl = localStorage.getItem('ai_base_url');
  const savedModel = localStorage.getItem('ai_model');
  localStorage.clear();
  localStorage.setItem('inf_version', DATA_VERSION);
  if (savedProvider) localStorage.setItem('ai_provider', savedProvider);
  if (savedKey) localStorage.setItem('ai_key', savedKey);
  if (savedBaseUrl) localStorage.setItem('ai_base_url', savedBaseUrl);
  if (savedModel) localStorage.setItem('ai_model', savedModel);
};

export const loadAiConfig = () => {
  const savedProvider = localStorage.getItem('ai_provider');
  const savedKey = localStorage.getItem('ai_key');
  const savedBaseUrl = localStorage.getItem('ai_base_url');
  const savedModel = localStorage.getItem('ai_model');
  return {
    provider: savedProvider,
    apiKey: savedKey,
    baseUrl: savedBaseUrl,
    model: savedModel
  };
};

export const saveAiConfig = (config: {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}) => {
  localStorage.setItem('ai_provider', config.provider);
  localStorage.setItem('ai_key', config.apiKey);
  if (config.baseUrl) {
    localStorage.setItem('ai_base_url', config.baseUrl);
  } else {
    localStorage.removeItem('ai_base_url');
  }
  if (config.model) {
    localStorage.setItem('ai_model', config.model);
  } else {
    localStorage.removeItem('ai_model');
  }
};