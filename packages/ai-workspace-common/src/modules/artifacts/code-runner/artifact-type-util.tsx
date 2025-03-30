import { CodeArtifactType } from '@refly/openapi-schema';

const typeMapping: Record<string, { mime: CodeArtifactType; display: string }> = {
  react: { mime: 'application/refly.artifacts.react', display: 'React' },
  svg: { mime: 'image/svg+xml', display: 'SVG' },
  mermaid: { mime: 'application/refly.artifacts.mermaid', display: 'Mermaid' },
  markdown: { mime: 'text/markdown', display: 'Markdown' },
  code: { mime: 'application/refly.artifacts.code', display: 'Code' },
  html: { mime: 'text/html', display: 'HTML' },
};
// Function to get simple type description with fuzzy matching
export const getSimpleTypeDescription = (type: CodeArtifactType): string => {
  // Check for exact match first
  for (const [, value] of Object.entries(typeMapping)) {
    if (value.mime === type) {
      return value.display;
    }
  }
  // If no exact match, try fuzzy matching
  const typeStr = type.toLowerCase();
  for (const [key, value] of Object.entries(typeMapping)) {
    if (typeStr.includes(key.toLowerCase())) {
      return value.display;
    }
  }
  // Default fallback
  return type;
};

// Function to get all available artifact types with labels
export const getArtifactTypeOptions = () => {
  // Use entries to get a unique array of options
  return Object.entries(typeMapping).map(([key, { mime, display }]) => ({
    value: mime,
    label: display,
    // Add a unique key to prevent React warnings about duplicate keys
    key: key,
  }));
};

// Function to get file extension based on artifact type with fuzzy matching
export const getFileExtensionFromType = (type: CodeArtifactType): string => {
  const extensionMap: Record<string, string> = {
    react: 'tsx',
    svg: 'svg',
    mermaid: 'mmd',
    markdown: 'md',
    md: 'md',
    code: '', // Will be determined by language
    html: 'html',
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    css: 'css',
    java: 'java',
  };

  // Try exact match first
  for (const [key, value] of Object.entries(typeMapping)) {
    if (value.mime === type) {
      return extensionMap[key] ?? '';
    }
  }
  // If no exact match, try fuzzy matching
  const typeStr = type.toLowerCase();
  for (const [key, extension] of Object.entries(extensionMap)) {
    if (typeStr.includes(key.toLowerCase())) {
      return extension;
    }
  }
  // Default fallback
  return '';
};
// Helper function to detect type from content (for external use)
export const detectActualTypeFromType = (type: CodeArtifactType): CodeArtifactType => {
  const lowerContent = type.toLowerCase();

  if (lowerContent.includes('react')) {
    return typeMapping.react.mime;
  }

  if (lowerContent.includes('svg')) {
    return typeMapping.svg.mime;
  }

  if (
    lowerContent.includes('mermaid') ||
    lowerContent.includes('graph') ||
    lowerContent.includes('flowchart')
  ) {
    return typeMapping.mermaid.mime;
  }

  if (lowerContent.includes('markdown')) {
    return typeMapping.markdown.mime;
  }

  if (lowerContent.includes('html')) {
    return typeMapping.html.mime;
  }

  // Default to code if no specific type detected
  return typeMapping.code.mime;
};
