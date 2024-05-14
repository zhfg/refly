import crypto from 'crypto';
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

export function genResourceID(): string {
  return 'r-' + createId();
}

export function genCollectionID(): string {
  return 'cl-' + createId();
}

export function sha256Hash(str: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}
