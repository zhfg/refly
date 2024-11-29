import { Button, Tooltip } from 'antd';
import { BsChatLeftQuote } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';

interface ContentSelectorButtonsProps {
  text: string;
  handleClick: () => void;
}

export const ContentSelectorButtons: React.FC<ContentSelectorButtonsProps> = (props) => {
  const { handleClick } = props;
  const { t } = useTranslation();

  return (
    <Tooltip title={t('knowledgeBase.canvas.editor.toolbar.quote')}>
      <div className="flex items-center">
        <Button ghost type="text" size="small" className="rounded-none" onClick={handleClick}>
          <BsChatLeftQuote className="w-4 h-4" />
        </Button>
      </div>
    </Tooltip>
  );
};
