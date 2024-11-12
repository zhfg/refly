import React, { useEffect, useState, useMemo } from 'react';
import { Spin } from 'antd';

import './index.scss';
import { IconLoading } from '@arco-design/web-react/icon';

// Add translation cache
const translationCache: Record<string, string> = {};
const getCacheKey = (text: string, source: string, target: string) => `${source}:${target}:${text}`;

interface TranslationWrapperProps {
  content: string;
  targetLanguage: string;
  originalLocale?: string;
  className?: string;
}

// 限制请求频率的延迟时间（毫秒）
const THROTTLE_DELAY = 200;

// 翻译文本的队列和状态管理
let translationQueue: (() => Promise<void>)[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || translationQueue.length === 0) return;

  isProcessing = true;
  const task = translationQueue.shift();
  if (task) {
    await task();
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_DELAY));
  }
  isProcessing = false;
  processQueue();
};

export const TranslationWrapper: React.FC<TranslationWrapperProps> = ({
  content,
  targetLanguage,
  originalLocale,
  className,
}) => {
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const shouldTranslate = useMemo(() => {
    if (targetLanguage === 'auto') return false;
    if (!originalLocale) return true;
    return originalLocale !== targetLanguage;
  }, [targetLanguage, originalLocale]);

  const cacheKey = useMemo(() => {
    return getCacheKey(content, originalLocale || 'auto', targetLanguage);
  }, [content, originalLocale, targetLanguage]);

  const translateText = async (text: string) => {
    // Check cache first
    const cached = translationCache[cacheKey];
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${
          originalLocale || 'auto'
        }&tl=${targetLanguage}&q=${encodeURIComponent(text)}`,
      );
      const data = await response.json();
      const translated = data[0][0][0];

      // Store in cache
      translationCache[cacheKey] = translated;
      return translated;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  };

  useEffect(() => {
    if (!shouldTranslate || !content) {
      setTranslatedContent(null);
      return;
    }

    // Check cache first
    const cached = translationCache[cacheKey];
    if (cached) {
      setTranslatedContent(cached);
      return;
    }

    setIsLoading(true);

    const translationTask = async () => {
      const translated = await translateText(content);
      setTranslatedContent(translated);
      setIsLoading(false);
    };

    translationQueue.push(translationTask);
    processQueue();

    return () => {
      translationQueue = translationQueue.filter((task) => task !== translationTask);
    };
  }, [content, shouldTranslate, cacheKey]);

  // 如果不需要翻译或翻译完成但结果与原文相同
  if (!shouldTranslate || translatedContent === content) {
    return <span className={className}>{content}</span>;
  }

  return (
    <div className={`translation-wrapper ${className || ''}`}>
      <div className="translation-content">
        {isLoading ? (
          <>
            <span className="original-text">{content}</span>
            <Spin indicator={<IconLoading style={{ fontSize: 12, marginLeft: 4 }} spin />} />
          </>
        ) : (
          <span>{translatedContent || content}</span>
        )}
      </div>
    </div>
  );
};
