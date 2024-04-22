import { createId } from '@paralleldrive/cuid2';

export function genUID(): string {
  return 'u-' + createId();
}

export function genLinkID(): string {
  return 'l-' + createId();
}
