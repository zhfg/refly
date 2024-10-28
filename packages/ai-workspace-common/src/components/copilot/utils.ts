import { CANVAS_THINKING_TAG_REGEX, CANVAS_TAG_REGEX } from '@refly-packages/ai-workspace-common/constants/canvas';

/**
 * Replace all line breaks in the matched `reflyCanvas` tag with an empty string
 * Handle content with code examples safely
 */
export const processWithCanvas = (input: string = '') => {
  if (typeof input !== 'string') {
    console.warn('Input is not a string:', input);
    return '';
  }

  let output = input;

  // Helper function to safely process content
  const safelyProcessContent = (content: string) => {
    try {
      // First protect code blocks content
      return content.replace(/```[\s\S]*?```/g, (codeBlock) => {
        // Escape all potentially problematic characters in code blocks
        return codeBlock.replace(
          /[<>&'"]/g,
          (char) =>
            ({
              '<': '&lt;',
              '>': '&gt;',
              '&': '&amp;',
              "'": '&apos;',
              '"': '&quot;',
            })[char] || char,
        );
      });
    } catch (error) {
      console.warn('Error processing code blocks:', error);
      return content;
    }
  };

  // Helper function to process tags
  const processTag = (content: string, regex: RegExp) => {
    try {
      return content.replace(regex, (match) => {
        // Process the content safely
        const processedMatch = safelyProcessContent(match);
        // Remove line breaks
        return processedMatch.replaceAll(/\r?\n|\r/g, '');
      });
    } catch (error) {
      console.warn('Error processing tag:', error);
      return content;
    }
  };

  // Process thinking tag first
  const thinkMatch = CANVAS_THINKING_TAG_REGEX.exec(output);
  if (thinkMatch) {
    output = processTag(output, CANVAS_THINKING_TAG_REGEX);
  }

  // Process canvas tag
  const match = CANVAS_TAG_REGEX.exec(output);
  if (match) {
    return processTag(output, CANVAS_TAG_REGEX);
  }

  // Check for unclosed canvas tag
  const unclosedRegex = /<reflyCanvas\b(?:(?!\/?>)[\S\s])*$/;
  if (unclosedRegex.test(output)) {
    try {
      return output.replace(unclosedRegex, '<reflyCanvas>');
    } catch (error) {
      console.warn('Error processing unclosed canvas tag:', error);
      return output;
    }
  }

  return output;
};

export const getCanvasContent = (content: string) => {
  const result = content.match(CANVAS_TAG_REGEX);

  return result?.groups?.content || '';
};
