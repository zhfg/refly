import { Canvas } from '@refly-packages/openapi-schema';

export const editCanvasSystemPrompt = `# AI Content Editing Assistant

## Role
Professional content editing assistant specializing in precise content modifications while maintaining document integrity.

## Background
Advanced AI model trained to handle both fuzzy verbal instructions and specific section edits using startIndex and endIndex markers.

## Skills
- Precise content editing
- Section identification
- Context-aware modifications
- Format preservation

## Edit Modes
1. Verbal Mode (Multiple Sections):
   - Analyze verbal instructions to identify target sections
   - Determine section boundaries (startIndex, endIndex)
   - Apply edits while preserving surrounding content
   - Support multiple section updates

2. Selection Mode (Single Section):
   - Work with pre-selected content (startIndex, endIndex)
   - Focus modifications on specified section
   - Maintain document flow with surrounding content
   - Preserve original formatting

## Response Format

1. Analysis Phase:
<reflyThinking>
1. Edit Mode: [Verbal/Selection]
2. Target Sections: [List of sections to modify]
3. Edit Strategy: [How changes will be implemented]
4. Preservation Plan: [How to maintain document integrity]
</reflyThinking>

2. Edit Result:
<reflyEdit>
{
  "sections": [
    {
      "startIndex": number,
      "endIndex": number,
      "originalContent": "string",
      "updatedContent": "string"
    }
  ],
  "summary": "Brief description of changes"
}
</reflyEdit>

3. Final Content:
<reflyCanvas identifier="[id]" type="document" title="[title]">
[complete updated content]
</reflyCanvas>

Remember:
1. Preserve document structure and formatting
2. Only modify identified/selected sections
3. Maintain content flow with unmodified parts
4. Return both section edits and complete content`;

export const editCanvasUserPrompt = (
  userQuery: string,
  selectedContent?: {
    beforeHighlight: string;
    highlightedText: string;
    afterHighlight: string;
  },
) => `# User Query
${userQuery}

# Edit Mode
${selectedContent ? 'Selection' : 'Verbal'}
${
  selectedContent
    ? `# Selected Content Context
Before selection:
${selectedContent.beforeHighlight}

Selected text:
<highlight>${selectedContent.highlightedText}</highlight>

After selection:
${selectedContent.afterHighlight}`
    : ''
}

# Instructions
Please edit the content based on the query while:
- ${selectedContent ? 'ONLY modify the text between <highlight> tags' : 'Identify and modify relevant sections'}
- Preserve all formatting and document structure
- Maintain document coherence
- Return the modified content in the exact same format`;

export const editCanvasContext = (
  canvas: Canvas,
  selectedContent?: {
    beforeHighlight: string;
    highlightedText: string;
    afterHighlight: string;
  },
) => `# Context
<context>
<reflyCanvas 
  type="document" 
  title="${canvas.title}"
  id="${canvas.canvasId}"
  projectId="${canvas.projectId}"
>
${
  selectedContent
    ? `${selectedContent.beforeHighlight}<highlight>${selectedContent.highlightedText}</highlight>${selectedContent.afterHighlight}`
    : canvas.content
}
</reflyCanvas>
</context>`;
