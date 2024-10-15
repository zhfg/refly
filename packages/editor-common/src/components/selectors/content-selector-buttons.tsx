import { Button } from '../ui/button';

interface ContentSelectorButtonsProps {
  text: string;
  handleClick: () => void;
}
export const ContentSelectorButtons: React.FC<ContentSelectorButtonsProps> = (props) => {
  const { text, handleClick } = props;

  return (
    <div className="flex">
      <Button size="sm" variant="ghost" className="rounded-none" onClick={handleClick}>
        <span className="text-xs font-medium" style={{ color: '#00968F' }}>
          {text}
        </span>
      </Button>
    </div>
  );
};
