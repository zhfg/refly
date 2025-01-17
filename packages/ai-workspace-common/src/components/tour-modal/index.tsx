import { Modal, Input, Button, Tour, TourProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useUserStoreShallow } from '@refly-packages/ai-workspace-common/stores/user';
import './index.scss';

const steps = [
  {
    key: '1',
    videoUrl: 'https://www.youtube.com/embed/e-ORhEE9VVg?si=TmtIV3TxqBhYWHxO',
  },
  {
    key: '2',
    videoUrl: 'https://www.youtube.com/embed/nfWlot6h_JM?si=fvmInK1WR2tST8f6',
  },
  {
    key: '3',
    videoUrl: 'https://www.youtube.com/embed/3tmd-ClpJxA?si=DqD9AF81XevWqcBw',
  },
  {
    key: '4',
    videoUrl: 'https://www.youtube.com/embed/MWgWy_LBtko',
  },
  {
    key: '5',
    videoUrl: 'https://www.youtube.com/embed/MWgWy_LBtko',
  },
];

const TourContent = (props: { description: string; videoUrl: string }) => {
  const { description, videoUrl } = props;
  return (
    <div>
      <div className="mb-4">{description}</div>
      <div className="relative pb-[56.25%]">
        <iframe
          className="absolute left-0 top-0 h-full w-full !border-none"
          src={videoUrl}
          title="tour video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export const TourModal = () => {
  const { t } = useTranslation();
  const { showTourModal, setShowTourModal } = useUserStoreShallow((state) => ({
    showTourModal: state.showTourModal,
    setShowTourModal: state.setShowTourModal,
  }));

  const tourSteps: TourProps['steps'] = steps.map((step) => ({
    title: <div className="text-xl font-bold">{t(`tour.onboardingModal.title.${step.key}`)}</div>,
    description: (
      <TourContent description={t(`tour.onboardingModal.description.${step.key}`)} videoUrl={step.videoUrl} />
    ),
    target: null,
  }));

  const handleClose = () => {
    console.log('close');
    setShowTourModal(false);
  };

  return <Tour rootClassName="onboarding-modal" open={showTourModal} onClose={handleClose} steps={tourSteps} />;
};
