export interface BaseStreamEvent {
  event: string;
  name: string;
  content: string;
}

export interface SkillMetadata {
  skillId: string;
  skillName: string;
}

export interface SkillEvent extends BaseStreamEvent {
  event: 'on_skill_start' | 'on_skill_stream' | 'on_skill_end';
  metadata: SkillMetadata;
}

export interface OutputMessage extends BaseStreamEvent {
  event: 'on_output_start' | 'on_output_stream' | 'on_output_end';
}
