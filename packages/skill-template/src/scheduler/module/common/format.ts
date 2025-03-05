export const buildFormatDisplayInstruction = () => {
  return `
  ## Markdown Formatting Guidelines:
  1. Heading Level Requirements:
     - Maximum heading level should be H3 (###)
     - Sub-sections should use H4 (####)
     - Never use H1 or H2 headings
     - Maintain proper heading hierarchy

  2. General Formatting Rules:
     - Use proper markdown syntax
     - Keep content well-structured
     - Ensure consistent indentation
     - Follow heading level hierarchy strictly

   3. Mermaid Diagram Rules:
     - Mermaid renderer version is 10.9.0, please follow this version's syntax.
  `;
};
