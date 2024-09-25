let configuredHljs: any = null;

export const configureHighlightJs = async () => {
  if (configuredHljs) return configuredHljs;

  const hljs = (await import('highlight.js/lib/core')).default;

  const languages = {
    java: () => import('highlight.js/lib/languages/java'),
    javascript: () => import('highlight.js/lib/languages/javascript'),
    python: () => import('highlight.js/lib/languages/python'),
    go: () => import('highlight.js/lib/languages/go'),
    css: () => import('highlight.js/lib/languages/css'),
    c: () => import('highlight.js/lib/languages/c'),
    cpp: () => import('highlight.js/lib/languages/cpp'),
    csharp: () => import('highlight.js/lib/languages/csharp'),
    json: () => import('highlight.js/lib/languages/json'),
    markdown: () => import('highlight.js/lib/languages/markdown'),
    sql: () => import('highlight.js/lib/languages/sql'),
    typescript: () => import('highlight.js/lib/languages/typescript'),
    yaml: () => import('highlight.js/lib/languages/yaml'),
    php: () => import('highlight.js/lib/languages/php'),
    rust: () => import('highlight.js/lib/languages/rust'),
    shell: () => import('highlight.js/lib/languages/shell'),
    swift: () => import('highlight.js/lib/languages/swift'),
    ruby: () => import('highlight.js/lib/languages/ruby'),
  };

  await Promise.all(
    Object.entries(languages).map(async ([name, importFn]) => {
      const language = (await importFn()).default;
      hljs.registerLanguage(name, language);
    }),
  );

  configuredHljs = hljs;
  return configuredHljs;
};
