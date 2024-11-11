import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';

interface TranslationWrapperProps {
  content: string;
  targetLanguage: string;
  originalLocale?: string;
  className?: string;
}

// 限制请求频率的延迟时间（毫秒）
const THROTTLE_DELAY = 1000;

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
  const [translatedContent, setTranslatedContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);

  const shouldTranslate = (source: string, target: string): boolean => {
    if (target === 'auto') return false;
    if (!source) return true; // 如果没有源语言，则默认翻译
    return source !== target;
  };

  const translateText = async (text: string) => {
    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${originalLocale || 'auto'}&tl=${targetLanguage}&q=${encodeURIComponent(text)}`,
      );
      const data = await response.json();
      return data[0][0][0];
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  };

  useEffect(() => {
    if (!shouldTranslate(originalLocale, targetLanguage) || !content) {
      setTranslatedContent(content);
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
  }, [content, targetLanguage, originalLocale]);

  if (isLoading) {
    return <Spin size="small" />;
  }

  return <span className={className}>{translatedContent}</span>;
};
