import { useCallback, useState, useEffect, useMemo } from 'react';
import { Step, STATUS, ACTIONS, CallBackProps } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { Node } from '@xyflow/react';

export const useCanvasTour = (nodes: Node[]) => {
  const { t } = useTranslation();
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="new-canvas"]',
        content: t('tour.newCanvas'),
      },
      {
        target: '[data-tour="create-document"]',
        content: t('tour.createDocument'),
        disableBeacon: true,
        disableOverlayClose: true,
        spotlightClicks: true,
      },
      {
        target: '[data-tour="ask-ai"]',
        content: t('tour.askAI'),
        disableBeacon: true,
        disableOverlayClose: true,
        spotlightClicks: true,
      },
    ],
    [t],
  );

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      setStepIndex(0);
    } else if (type === 'step:after' && action === ACTIONS.NEXT) {
      setStepIndex(index + 1);
    }
  }, []);

  const handleStartTour = useCallback(() => {
    setTimeout(() => {
      setRunTour(true);
      setStepIndex(0);
    }, 500);
  }, []);

  // Listen for canvas creation to advance to next step
  useEffect(() => {
    if (runTour && stepIndex === 0 && nodes?.length > 0) {
      setStepIndex(1);
    }
  }, [runTour, stepIndex, nodes?.length]);

  // Listen for document creation to advance to next step
  useEffect(() => {
    if (runTour && stepIndex === 1 && nodes?.some((node) => node.type === 'document')) {
      setStepIndex(2);
    }
  }, [runTour, stepIndex, nodes]);

  return {
    runTour,
    stepIndex,
    steps,
    handleJoyrideCallback,
    handleStartTour,
  };
};
