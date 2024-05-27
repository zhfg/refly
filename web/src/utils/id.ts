import { createId } from "@paralleldrive/cuid2"

export function genUID(): string {
  return "u-" + createId()
}

export function genLinkID(): string {
  return "l-" + createId()
}

export function genConvID(): string {
  return "cv-" + createId()
}

export function genResourceID(): string {
  return "r-" + createId()
}

export function genCollectionID(): string {
  return "cl-" + createId()
}
