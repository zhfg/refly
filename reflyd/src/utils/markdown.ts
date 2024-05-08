export function tidyMarkdown(markdown: string): string {
  // Step 1: Handle complex broken links with text and optional images spread across multiple lines
  let normalizedMarkdown = markdown.replace(
    /\[\s*([^\]\n]+?)\s*\]\s*\(\s*([^)]+)\s*\)/g,
    (match, text, url) => {
      // Remove internal new lines and excessive spaces within the text
      text = text.replace(/\s+/g, ' ').trim();
      url = url.replace(/\s+/g, '').trim();
      return `[${text}](${url})`;
    },
  );

  normalizedMarkdown = normalizedMarkdown.replace(
    /\[\s*([^\]\n!]*?)\s*\n*(?:!\[([^\]]*)\]\((.*?)\))?\s*\n*\]\s*\(\s*([^)]+)\s*\)/g,
    (match, text, alt, imgUrl, linkUrl) => {
      // Normalize by removing excessive spaces and new lines
      text = text.replace(/\s+/g, ' ').trim();
      alt = alt ? alt.replace(/\s+/g, ' ').trim() : '';
      imgUrl = imgUrl ? imgUrl.replace(/\s+/g, '').trim() : '';
      linkUrl = linkUrl.replace(/\s+/g, '').trim();
      if (imgUrl) {
        return `[${text} ![${alt}](${imgUrl})](${linkUrl})`;
      } else {
        return `[${text}](${linkUrl})`;
      }
    },
  );

  // Step 2: Normalize regular links that may be broken across lines
  normalizedMarkdown = normalizedMarkdown.replace(
    /\[\s*([^\]]+)\]\s*\(\s*([^)]+)\)/g,
    (match, text, url) => {
      text = text.replace(/\s+/g, ' ').trim();
      url = url.replace(/\s+/g, '').trim();
      return `[${text}](${url})`;
    },
  );

  // Step 3: Remove leading spaces from each line
  normalizedMarkdown = normalizedMarkdown.replace(/^[ \t]+/gm, '');

  // Step 4: Replace more than two consecutive empty lines with exactly two empty lines
  normalizedMarkdown = normalizedMarkdown.replace(/\n{3,}/g, '\n\n');

  return normalizedMarkdown.trim();
}

export function cleanMarkdownForLLM(markdown: string): string {
  // Regular expression to match Markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Replace each link with the link text
  // example: "Check out [Google](https://www.google.com)!" => "Check out Google!"
  return markdown.replace(linkRegex, (match, linkText, linkUrl) => {
    return linkText;
  });
}
