export const getShareLink = (entityType: string, shareId: string) => {
  let entity = '';
  if (entityType === 'canvas') {
    entity = 'canvas';
  } else if (entityType === 'codeArtifact') {
    entity = 'code';
  } else if (entityType === 'skillResponse') {
    entity = 'skill-response';
  } else if (entityType === 'document') {
    entity = 'document';
  }
  return `${window.location.origin}/share/${entity}/${shareId}`;
};
