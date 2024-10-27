// Helper function to extract edit sections from response
export const extractEditSections = (
  content: string,
): Array<{
  startIndex: number;
  endIndex: number;
  originalContent: string;
  updatedContent: string;
}> => {
  try {
    const editMatch = content.match(/<reflyEdit>([\s\S]*?)<\/reflyEdit>/);
    if (editMatch) {
      const editJson = JSON.parse(editMatch[1]);
      return editJson.sections;
    }
  } catch (error) {
    console.error('Failed to parse edit sections:', error);
  }
  return [];
};
