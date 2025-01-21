import { useTranslation } from 'react-i18next';
import { Modal, Button } from 'antd';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useUpdateSettings } from '@refly-packages/ai-workspace-common/queries';
import { useMemo, useState } from 'react';
import { LuLightbulb } from 'react-icons/lu';
import { useVideo } from '@refly-packages/ai-workspace-common/hooks/use-video';
import { Spin } from '@refly-packages/ai-workspace-common/components/common/spin';

const steps = [
  {
    key: '1',
    videoUrl: 'https://www.youtube.com/embed/7aAFcsV_Ts0?si=rT6iYZZYjg4VTn5l',
  },
  {
    key: '2',
    videoUrl: 'https://www.youtube.com/embed/P7Hfq3nfFvY?si=TnYYJQc7LsQmYX-R',
  },
  {
    key: '3',
    videoUrl: 'https://www.youtube.com/embed/yofLxuAKiNM?si=7erwVv-7P4TIwP9g',
  },
  {
    key: '4',
    videoUrl: 'https://www.youtube.com/embed/_EaxsxXH5V0?si=KjgwkQeInjq3RDju',
  },
  {
    key: '5',
    videoUrl: 'https://www.youtube.com/embed/rNuvdNRQGDw?si=Vk1Y57TGLtDqpVdW',
  },
  {
    key: '6',
    videoUrl: 'https://www.youtube.com/embed/0JRg52MJMBs?si=KO133RQyQzXgDK3O',
  },
];

const TourContent = ({ description, videoUrl }: { description: string; videoUrl: string }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-gray-600">{description}</p>
      <div className="flex justify-center">
        <div className="relative w-full" style={{ height: '400px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-50 rounded-lg">
              <Spin className="w-6 h-6" />
              <div className="text-gray-600 text-sm mt-2">{t('canvas.toolbar.videoLoading')}</div>
            </div>
          )}
          <iframe
            width="100%"
            height="100%"
            src={videoUrl}
            title="Tutorial video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="w-full rounded-lg bg-black"
            style={{
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
            }}
            onLoad={() => {
              setTimeout(() => setIsLoading(false), 500);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const TourModal = () => {
  const { t } = useTranslation();
  const { showTourModal, setShowTourModal, userProfile, setUserProfile, setHelpModalVisible } = useUserStoreShallow(
    (state) => ({
      showTourModal: state.showTourModal,
      setShowTourModal: state.setShowTourModal,
      userProfile: state.userProfile,
      setUserProfile: state.setUserProfile,
      setHelpModalVisible: state.setHelpModalVisible,
    }),
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [finishedOnboardingTour, setFinishedOnboardingTour] = useState<boolean>(
    ['skipped', 'completed'].includes(userProfile?.onboarding?.tour ?? ''),
  );

  const { mutate: updateSettings } = useUpdateSettings();

  const handleClose = (status: 'skipped' | 'completed') => {
    setShowTourModal(false);
    if (!finishedOnboardingTour) {
      setUserProfile({
        ...userProfile,
        onboarding: {
          ...userProfile?.onboarding,
          tour: status,
        },
      });

      updateSettings({
        body: {
          onboarding: {
            ...userProfile?.onboarding,
            tour: status,
          },
        },
      });
      setFinishedOnboardingTour(true);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose('completed');
      setHelpModalVisible(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = useMemo(() => steps[currentStep], [currentStep]);

  const title =
    t('tour.onboardingModal.title') +
    ` (${currentStepData.key}/6) : ` +
    t(`tour.onboardingModal.highlight.${currentStepData.key}`);

  return (
    <Modal centered width={800} open={showTourModal} onCancel={() => handleClose('skipped')} footer={null}>
      {/* Content */}
      <div className="mb-6">
        <h2 className="mb-4 flex items-center gap-1 text-lg font-bold text-gray-900">
          <LuLightbulb /> <span>{title}</span>
        </h2>
        <TourContent
          description={t(`tour.onboardingModal.description.${currentStepData.key}`)}
          videoUrl={currentStepData.videoUrl}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <Button onClick={handlePrev} disabled={currentStep === 0}>
            {t('tour.onboardingModal.prev')}
          </Button>
          <Button type="primary" onClick={handleNext}>
            {currentStep === steps.length - 1
              ? t('tour.onboardingModal.startInteractive')
              : t('tour.onboardingModal.next')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
