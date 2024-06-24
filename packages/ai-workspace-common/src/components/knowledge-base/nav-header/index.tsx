import { IconMessage } from '@arco-design/web-react/icon';

import './index.scss';

export const KnowledgeBaseNavHeader = () => {
  return (
    <div className="knowledge-base-nav-container">
      <div className="knowledge-base-nav-navigation-bar">
        <div className="conv-meta">
          <IconMessage style={{ color: 'rgba(0, 0, 0, .6)' }} />
        </div>
      </div>
      <div className="knowledge-base-detail-menu">
        {/* <Button
            type="text"
            icon={<IconMore style={{ fontSize: 16 }} />}></Button> */}
      </div>
    </div>
  );
};
