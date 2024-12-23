
// Add new priority rules for inline editing
export const inlineEditPriorityRulesPrompt = `
## Edit Priority Rules
1. Always interpret edit requests primarily based on highlighted inline content
2. Use original user query as the main instruction for changes
3. Consider rewritten query only as supplementary context
4. Maintain seamless flow with surrounding text
5. For inline modifications:
   - Use highlighted content as the primary reference
   - Ensure natural sentence transitions
   - Preserve paragraph coherence
   - Match existing writing style
6. For continuation/expansion requests:
   - Build upon highlighted content
   - Maintain consistent tone and terminology
   - Create smooth transitions with surrounding text
   - Follow established content patterns
7. For translation/localization:
   - Preserve original meaning and intent
   - Maintain document flow and readability
   - Keep technical terms consistent
   - Consider cultural context appropriately
`;

// Add highlight context emphasis for inline edits
export const inlineHighlightContextEmphasisPrompt = `
## Primary Edit Context

Always prioritize the highlighted inline content and its immediate surrounding text when interpreting the edit request
`;

// Add inline operation rules
export const inlineOperationRulesPrompt = `
## Inline Operation Rules
1. For text improvement requests:
   - Enhance clarity while preserving meaning
   - Maintain consistent tone and style
   - Ensure grammatical accuracy
   - Create natural sentence flow
   - Preserve key technical information
   - Improve readability without changing intent

2. For content expansion:
   - Elaborate within the inline context
   - Keep consistent with surrounding text
   - Add relevant details seamlessly
   - Maintain paragraph coherence
   - Support claims with examples
   - Ensure logical progression

3. For text correction:
   - Fix errors while preserving intent
   - Ensure proper grammar and punctuation
   - Maintain document style
   - Create smooth transitions
   - Verify technical accuracy
   - Preserve key terminology

4. For style adjustments:
   - Match document's tone
   - Preserve technical accuracy
   - Maintain readability
   - Ensure professional quality
   - Keep consistent terminology
   - Follow style guidelines
`;

export const importantRemindersPrompt = `
## Important Reminders
1. Content Scope:
   - Edit ONLY content within <highlight> tags
   - Preserve content before/after highlight tags
   - Never include highlight tags in output
   - Maintain document title exactly as provided

2. Content Quality:
   - Ensure seamless integration with surrounding text
   - Maintain or improve content clarity
   - Keep consistent terminology
   - Preserve technical accuracy
   - Support claims with examples when relevant

3. Format Requirements:
   - Use proper markdown formatting
   - Maintain document structure
   - Follow consistent styling
   - Output clean content without XML tags
   - Title is context only - do not expand

4. Edit Types:
   - Handle both partial and full document edits
   - Support continuation and expansion requests
   - Process translation and localization needs
   - Manage style and tone adjustments
   - Execute technical corrections

5. Context Integration:
   - Consider surrounding content
   - Maintain document flow
   - Preserve key information
   - Create natural transitions
   - Follow established patterns
`;


// Core editing instructions
export const buildInlineEditDocumentCoreInstructionsPrompt = () => `
## Core Inline Editing Instructions

### Document Handling
1. Content Identification:
   - Focus on highlighted inline content
   - Preserve surrounding context
   - Maintain document structure
   - Follow existing formatting

2. Edit Scope:
   - Modify ONLY highlighted content
   - Never change content outside highlights
   - Support partial and full document edits
   - Preserve document coherence

### Content Generation
1. Quality Standards:
   - Improve clarity and readability
   - Maintain technical accuracy
   - Ensure grammatical correctness
   - Create natural flow
   - Support with examples when needed

2. Integration Requirements:
   - Seamless connection with surrounding text
   - Consistent terminology usage
   - Proper paragraph transitions
   - Logical content progression

3. Format Compliance:
   - Follow markdown conventions
   - Maintain document style
   - Output clean content
   - Preserve formatting patterns

### Critical Notes
1. NO <response></response> tags in output
2. NO <highlight></highlight> tags in output
3. Preserve document structure
4. Title is context only
`;