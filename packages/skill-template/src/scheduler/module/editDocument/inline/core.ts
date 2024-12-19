export const importantRemindersPrompt = `
## Important Reminders
1. Content within <highlight> tags indicates the section to modify
2. DO NOT include <response> tags in your output - they are only for demonstration in examples
3. Two possible scenarios:
   - Partial document: Preserve content before/after highlight tags
   - Full document: Replace entire content when no content before/after tags
4. Never include highlight tags in the output
5. Always maintain exact document title from context
6. Title is contextual information only - not for expansion
7. Including detailed explanations and examples
8. Preserve document structure and formatting
9. Ensure proper integration with surrounding content
10. Output content directly without any XML-style tags
`;


// Core editing instructions
export const buildInlineEditDocumentCoreInstructionsPrompt = () => `
## Core Editing Instructions

### Constraints
1. Edit Scope:
   - Only modify content within <highlight> tags
   - Handle two scenarios:
     a. Partial document: Content before/after highlight tags exists
     b. Full document: No content before/after highlight tags
   - Never modify content outside highlight tags
   - Never reduce content length unnecessarily

2. Content Length:
   - Focus on improving highlighted content quality
   - Maintain or expand content length as needed
   - Ensure detailed explanations
   - Include relevant examples and context
   - Avoid unnecessary repetition or padding

3. Format Requirements:
   - Use proper markdown formatting
   - Maintain original document structure
   - Ensure edited content flows naturally with surrounding text
   - Keep formatting consistent with original
   - Output content directly without any XML-style tags

### Important Notes
1. DO NOT include <response> tags in your output - they are only for demonstration in examples
2. Output content directly without any wrapping tags
`;