const contentListTypeList = [
  'resourceSelection',
  'noteSelection',
  'extensionWeblinkSelection',
  'noteCursorSelection',
  'noteBeforeCursorSelection',
  'noteAfterCursorSelection',
];

export const isContentList = (type: string) => {
  return contentListTypeList.includes(type);
};

export const mapSelectionTypeToContentList = (type: string) => {
  return isContentList(type) ? 'contentList' : type;
};
