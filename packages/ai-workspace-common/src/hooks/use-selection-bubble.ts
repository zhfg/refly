import { useCallback, useEffect, useRef, useState } from 'react';
import type { Instance, Props } from 'tippy.js';

interface UseSelectionBubbleProps {
  containerClass: string;
  onSelect?: (selectedText: string) => void;
  enabled?: boolean;
}

export const useSelectionBubble = ({ containerClass, onSelect, enabled = true }: UseSelectionBubbleProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const bubbleRef = useRef<Instance<Props> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSelection = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    const container = document.querySelector(`.${containerClass}`);

    if (!selection || !container) return;

    const range = selection?.getRangeAt?.(0);
    const text = selection?.toString?.()?.trim?.();

    if (!text || selection?.isCollapsed) {
      setIsVisible(false);
      return;
    }

    // Check if selection is within the target container
    if (!container?.contains?.(range?.commonAncestorContainer)) {
      setIsVisible(false);
      return;
    }

    setSelectedText(text);
    setIsVisible(true);
    onSelect?.(text);
  }, [containerClass, enabled, onSelect]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!containerRef.current?.contains(event.target as Node)) {
      setIsVisible(false);
    }
  }, []);

  const closeBubble = useCallback(() => {
    setIsVisible(false);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enabled, handleSelection, handleClickOutside]);

  return {
    isVisible,
    selectedText,
    bubbleRef,
    containerRef,
    setIsVisible,
    closeBubble,
  };
};
