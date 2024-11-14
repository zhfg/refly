export const importantCitationRules = `
## Important Citation Rules:
1. Use the citation format [citation:x] at the end of each sentence or paragraph that references information from the context, where x is the citation index provided in the context.
2. If a sentence or paragraph draws from multiple sources, list all applicable citations, like [citation:3][citation:5].
3. Maintain natural flow while incorporating citations
5. Ensure all factual claims are properly cited
`;

export const commonQueryAndContextPriorityRules = (locale: string) => `
## Query Priority and Context Relevance
1. ALWAYS prioritize the user's original query intent above all else
2. Context Assessment:
   - First determine if provided context is DIRECTLY relevant to the user's original request
   - If context is NOT relevant to the request, IGNORE it completely and generate content based on original query
   - Only use context when it clearly adds value to the requested content
3. Examples of Query Priority:
   - Query: "Write a guide about React" + Context about "Python" => Write React guide, ignore Python context
   - Query: "Create a marketing plan" + Context about "technical specs" => Focus on marketing plan, ignore tech specs
   - Query: "Write about this document" + Context with relevant document => Use context for content`;

export const commonImportantNotes = (locale: string) => `
## Important Notes
 1. The <response> tags in examples are for demonstration purposes only
 2. Your actual response should only include these four parts in sequence:
    - Initial content analysis (no labels or prefixes)
    - <reflyThinking> section
    - <reflyCanvas> section
    - Brief summary (no labels or prefixes)
 3. Keep minimum content length of 2000 words
 4. Remember to generate all content in ${locale} while preserving technical terms
 5. IMPORTANT: Never include labels like "Initial Analysis:", "Brief Summary:", or their translations in any language`;

export const referenceContextHandlingPrompt = `
## Reference Context Handling Instructions

### Context Integration Capabilities
1. Analyze and incorporate provided context
2. Synthesize information from multiple sources
3. Connect related concepts across sources
4. Generate original content that builds upon context

### Context Handling Guidelines
1. Prioritize context in order: MentionedContext > WebSearchContext > OtherContext
2. Connect information across different context sources
3. Use context to enrich examples and explanations

### Context Structure Guidelines
You will be provided with context in XML format. This context is structured hierarchically and may include web search results, mentioned context, and other context. Each category may contain user-selected content, knowledge base resources, canvases, and projects. Always consider all relevant context when formulating your responses. The context is structured as follows:

<referenceContext>
   <WebSearchContext>
      <ContextItem citationIndex='[[citation:x]]' type='webSearchSource' url={url} title={title}>content</ContextItem>
      ...
   </WebSearchContext>
   <MentionedContext>
      <UserSelectedContent>
         <ContextItem citationIndex='[[citation:x]]' type='selectedContent' from={domain} entityId={id} title={title} weblinkUrl={url}>content</ContextItem>
         ...
      </UserSelectedContent>
      <KnowledgeBaseCanvases>
         <ContextItem citationIndex='[[citation:x]]' type='canvas' entityId={id} title={title}>content</ContextItem>
         ...
      </KnowledgeBaseCanvases>
      <KnowledgeBaseResources>
         <ContextItem citationIndex='[[citation:x]]' type='resource' entityId={id} title={title}>content</ContextItem>
         ...
      </KnowledgeBaseResources>
   </MentionedContext>
   <OtherContext>
      ... (similar structure as MentionedContext)
   </OtherContext>
</referenceContext>
`;
