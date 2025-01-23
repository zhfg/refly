import { LangCode } from './types';

// 语言检测函数
export async function detectLanguage(text: string): Promise<LangCode> {
  try {
    if (text.length > 1000) {
      text = text.slice(0, 1000);
    }

    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=en&q=${encodeURIComponent(text)}`,
    );

    if (!response.ok) {
      throw new Error('Language detection failed');
    }

    const data = await response.json();
    // Google API 返回检测到的语言代码在第三个元素
    const detectedLang = data?.[2] as string;

    // 处理特殊情况
    if (detectedLang === 'zh-CN') return 'zh-Hans';
    if (detectedLang === 'zh-TW') return 'zh-Hant';

    return (detectedLang as LangCode) || 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

// 翻译函数
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage = 'auto',
): Promise<string> {
  try {
    // 如果目标语言是 auto，直接返回原文
    if (targetLanguage === 'auto') {
      return text;
    }

    // 处理中文的特殊情况
    const normalizedTarget =
      targetLanguage === 'zh-Hans'
        ? 'zh-CN'
        : targetLanguage === 'zh-Hant'
          ? 'zh-TW'
          : targetLanguage;

    const normalizedSource =
      sourceLanguage === 'zh-Hans'
        ? 'zh-CN'
        : sourceLanguage === 'zh-Hant'
          ? 'zh-TW'
          : sourceLanguage;

    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${normalizedSource}&tl=${normalizedTarget}&q=${encodeURIComponent(
        text,
      )}`,
    );

    if (!response.ok) {
      throw new Error('Translation failed');
    }

    const data = await response.json();
    // 合并所有翻译片段
    const translatedText = data[0]
      .map((item: any[]) => item[0])
      .filter(Boolean)
      .join('');

    return translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // 发生错误时返回原文
  }
}

// 可选：添加批量翻译函数
export async function batchTranslateText(
  texts: string[],
  targetLanguage: string,
  sourceLanguage = 'auto',
): Promise<string[]> {
  // 使用 Promise.all 并发处理，但建议添加延迟避免请求过快
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const results: string[] = [];
  for (const text of texts) {
    const translated = await translateText(text, targetLanguage, sourceLanguage);
    results.push(translated);
    await delay(100); // 添加1秒延迟
  }

  return results;
}
