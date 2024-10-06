export const MAX_NEED_RECALL_TOKEN = 2000; // > 2000 need use recall for similar chunks other than use whole content
export const SHORT_CONTENT_THRESHOLD = 500; // < 500 tokens is a short content, can contains 39321.6 / 500 = 78.64 short content
export const MIN_RELEVANCE_SCORE = 0.7; // Minimum relevance score, used to filter out unrelated Chunks
