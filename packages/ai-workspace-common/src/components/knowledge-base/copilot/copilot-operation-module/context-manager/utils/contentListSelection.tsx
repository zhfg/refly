const contentListTypeList = [
  'resourceSelection',
  'noteSelection',
  'extensionWeblinkSelection',
  'canvasCursorSelection',
  'canvasBeforeCursorSelection',
  'canvasAfterCursorSelection',
];

export const isContentList = (type: string) => {
  return contentListTypeList.includes(type);
};

export const mapSelectionTypeToContentList = (type: string) => {
  return isContentList(type) ? 'contentList' : type;
};
