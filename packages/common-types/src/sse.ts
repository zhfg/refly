export interface SkillEvent {
  event: 'start' | 'end' | 'stream' | 'log' | 'structured_data';
  content?: string;
  skillId?: string;
  skillName: string;
  skillDisplayName: string;
  componentName?: string;
}
