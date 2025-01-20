import { useTranslation } from 'react-i18next';
import { Modal, Button } from 'antd';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import { useUpdateSettings } from '@refly-packages/ai-workspace-common/queries';
import { useMemo, useState } from 'react';
import { LuLightbulb } from 'react-icons/lu';
import { useVideo } from '@refly-packages/ai-workspace-common/hooks/use-video';

const steps = [
  {
    key: '1',
    videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
  },
  {
    key: '2',
    videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
  },
  {
    key: '3',
    videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
  },
  {
    key: '4',
    videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
  },
  {
    key: '5',
    videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
  },
  {
    key: '6',
    videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
  },
];

const TourContent = ({ description, videoUrl }: { description: string; videoUrl: string }) => {
  const { videoRef, handlePlay } = useVideo();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-gray-600">{description}</p>
      <div className="flex justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          controlsList="nodownload"
          loop
          playsInline
          onPlay={handlePlay}
          className="w-full h-auto object-cover rounded-lg bg-black"
        />
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
