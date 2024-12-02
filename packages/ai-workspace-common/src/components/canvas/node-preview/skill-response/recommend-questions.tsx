import { useChatStore } from '@refly-packages/ai-workspace-common/stores/chat';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';

export const RecommendQuestions = ({ relatedQuestions }: { relatedQuestions: string[] }) => {
  const { t } = useTranslation();
  const chatStore = useChatStore();

  return relatedQuestions?.length > 0 ? (
    <div className="mt-4">
      <div>
        <p
          className="
          text-xs
          font-medium
          text-black/50
          mb-1
        "
        >
          {t('copilot.message.relatedQuestion')}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {relatedQuestions?.map((item, index) => (
          <div
            key={index}
            className={`
              flex flex-row items-center justify-between
              rounded-lg
              transition-colors duration-200
              hover:cursor-pointer
              group
            `}
            onClick={() => {
              chatStore.setNewQAText(item);
              message.success(t('copilot.message.askFollowingSuccess'));
            }}
          >
            <p
              className="
                text-xs
                text-teal-600 
                group-hover:text-teal-600
                transition-colors duration-200
              "
            >
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  ) : null;
};
