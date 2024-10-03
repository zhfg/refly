export interface SkillContextContentItemMetadata {
  domain: string;
  url?: string;
  title: string;
  entityId?: string;
}

export type SelectedContentDomain = 'resourceSelection' | 'noteSelection' | 'extensionWeblinkSelection';
