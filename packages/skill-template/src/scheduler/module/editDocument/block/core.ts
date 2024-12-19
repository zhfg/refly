export const importantRemindersPrompt = `
## Important Reminders
1. Generate content at specified insertion point
2. Create comprehensive, well-structured blocks
3. Ensure proper integration with surrounding content
4. Support multiple block types and nested structures, generating multiple blocks as needed
5. Including detailed explanations and examples
6. Title is contextual information only - not for expansion
7. Ensure proper markdown formatting and structure
8. DO NOT include <response> tags in your output - they are only for demonstration in examples
9. Output content directly without any XML-style tags
`;

// Core block content generation instructions
export const buildBlockEditDocumentCoreInstructionsPrompt = () => `
## Core Block Content Generation Instructions

### Constraints
1. Generation Scope:
   - Generate content at specified insertion point(<highlight></highlight>)
   - Handle two scenarios:
     a. Partial document: Content before/after highlight tags exists
     b. Full document: No content before/after highlight tags
   - Never generate content outside highlight tags
   - Never reduce content length unnecessarily
   - Support multiple block types (headings, paragraphs, lists, todo lists(with [] as shortcut), code blocks, blockquote, images, etc.)
   - Title is for context only - do not rewrite or expand on it

2. Content Length:
   - Create multiple nested blocks when needed
   - Include detailed explanations and examples
   - Maintain appropriate depth based on context
   - Avoid unnecessary repetition or padding

3. Format Requirements:
   - Use proper markdown formatting
   - Follow document's existing structure
   - Maintain consistent heading hierarchy
   - Preserve document style and tone
   - Output content directly without any XML-style tags

### Important Notes
1. DO NOT include <response> tags in your output - they are only for demonstration in examples
3. Output content directly without any wrapping tags
`;