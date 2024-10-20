import md5 from 'md5';
import { v4 as UUIDV4 } from 'uuid';
import { createId } from '@paralleldrive/cuid2';

export function genUID(): string {
  return 'u-' + createId();
}

export function genEventID(): string {
  return 'ev-' + createId();
}

export function genLinkID(): string {
  return 'l-' + createId();
}

export function genLabelClassID(): string {
  return 'lc-' + createId();
}

export function genLabelInstanceID(): string {
  return 'li-' + createId();
}

export function genConvID(): string {
  return 'cv-' + createId();
}

export function genChatMessageID(): string {
  return 'cm-' + createId();
}

export function genResourceID(): string {
  return 'r-' + createId();
}

export function genCanvasID(): string {
  return 'c-' + createId();
}

export function genCollectionID(): string {
  return 'cl-' + createId();
}

export function genTokenUsageMeterID(): string {
  return 'tum-' + createId();
}

export function genStorageUsageMeterID(): string {
  return 'sum-' + createId();
}

export function genSkillID(): string {
  return 'sk-' + createId();
}

export function genSkillTriggerID(): string {
  return 'tr-' + createId();
}

export function genSkillJobID(): string {
  return 'sj-' + createId();
}

export function genContentSelectorID(): string {
  return 'cs-' + createId();
}

export const genUniqueId = () => {
  const uuid = UUIDV4();
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const id = `${uuid}${timestamp}${randomString}`;
  return md5(id);
};
