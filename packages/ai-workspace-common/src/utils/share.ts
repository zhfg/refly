export const getShareLink = (entityType: string, shareId: string) => {
  let entity = '';
  if (entityType === 'canvas') {
    entity = 'canvas';
  } else if (entityType === 'codeArtifact') {
    entity = 'code';
  }
  return `${window.location.origin}/share/${entity}/${shareId}`;
};
