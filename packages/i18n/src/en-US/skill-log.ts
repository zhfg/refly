const translations = {
  generateTitle: {
    title: 'Generate Title',
    description: 'Title generated: {{title}}, completed in {{duration}}ms',
  },
  generateTitleFailed: {
    title: 'Generate Title',
    description: 'Failed to generate title due to model capability, fallback to use query as title',
  },
  rewriteQuery: {
    title: 'Break Down Question',
    description: 'Sub queries: {{rewrittenQueries}}, completed in {{duration}}ms',
  },
  translateQuery: {
    title: 'Translate Query',
    description: 'Translated queries: {{translatedQueries}}, completed in {{duration}}ms',
  },
  webSearchCompleted: {
    title: 'Web Search Completed',
    description: 'Total of {{totalResults}} results, completed in {{duration}}ms',
  },
  librarySearchCompleted: {
    title: 'Library Search Completed',
    description: 'Total of {{totalResults}} results, completed in {{duration}}ms',
  },
  translateResults: {
    title: 'Translate Results',
    description: 'Total of {{totalResults}} results, completed in {{duration}}ms',
  },
  rerankResults: {
    title: 'Select Related Results',
    description: 'Total of {{totalResults}} results, completed in {{duration}}ms',
  },
  generateAnswer: {
    title: 'Generate Answer',
    description: 'Start to generate answer...',
  },
  extractUrls: {
    title: 'Extract URLs',
    description: 'Total of {{totalResults}} results, completed in {{duration}}ms',
  },
  crawlUrls: {
    title: 'Read URLs',
    description: 'Total of {{totalResults}} results, completed in {{duration}}ms',
  },
  analyzeQuery: {
    title: 'Analyze Query',
    description: 'Analyze query completed, completed in {{duration}}ms',
  },
  generatingCodeArtifact: {
    title: 'Generating Code Artifact',
    description: 'Code artifact generating, completed in {{duration}}ms',
  },
  codeArtifactGenerated: {
    title: 'Code Artifact Generated',
    description: 'Code artifact generated, completed in {{duration}}ms',
  },
};

export default translations;
