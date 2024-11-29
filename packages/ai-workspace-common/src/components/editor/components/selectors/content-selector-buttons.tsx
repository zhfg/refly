import { Button, Tooltip } from 'antd';
import { BsChatLeftQuote } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';

interface ContentSelectorButtonsProps {
  text: string;
  handleClick: () => void;
}

export const ContentSelectorButtons: React.FC<ContentSelectorButtonsProps> = (props) => {
  const { text, handleClick } = props;
  const { t } = useTranslation();

  return (
    <Tooltip title={t('knowledgeBase.canvas.editor.toolbar.quote')}>
      <div className="flex">
        <Button size="small" type="text" className="rounded-none" onClick={handleClick}>
          <BsChatLeftQuote style={{ color: '#00968F' }} />
        </Button>
      </div>
    </Tooltip>
  );
};
