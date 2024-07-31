import md5 from 'md5';
import { v4 as UUIDV4 } from 'uuid';
import { createId } from '@paralleldrive/cuid2';

export function genUID(): string {
  return 'u-' + createId();
}

export function genLinkID(): string {
  return 'l-' + createId();
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

export function genNoteID(): string {
  return 'n-' + createId();
}

export function genCollectionID(): string {
  return 'cl-' + createId();
}

export function genSkillID(): string {
  return 'sk-' + createId();
}

export function genSkillTriggerID(): string {
  return 'tr-' + createId();
}

export function genSkillLogID(): string {
  return 'lg-' + createId();
}

export const genUniqueId = () => {
  const uuid = UUIDV4();
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const id = `${uuid}${timestamp}${randomString}`;
  return md5(id);
};
