import Joyride from 'react-joyride';
import { Step, CallBackProps } from 'react-joyride';

interface CanvasTourProps {
  steps: Step[];
  run: boolean;
  stepIndex: number;
  callback: (data: CallBackProps) => void;
}

export const CanvasTour = ({ steps, run, stepIndex, callback }: CanvasTourProps) => {
  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      spotlightClicks
      hideBackButton
      floaterProps={{
        disableAnimation: true,
        hideArrow: false,
        offset: 10,
        placement: 'bottom',
      }}
      styles={{
        options: {
          primaryColor: '#00968F',
          zIndex: 10000,
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          textColor: '#333',
        },
        tooltip: {
          borderRadius: '8px',
          fontSize: '14px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#00968F',
          fontSize: '13px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#666',
          fontSize: '13px',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#666',
          fontSize: '13px',
        },
      }}
      callback={callback}
    />
  );
};
