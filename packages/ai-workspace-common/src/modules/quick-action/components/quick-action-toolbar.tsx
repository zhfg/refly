import Logo from '../../../assets/logo.svg';
import { useQuickActionStore } from '../stores/quick-action';

export const QuickActionToolbar = () => {
  const updateUIState = useQuickActionStore((state) => state.updateUIState);
  const isShowSide = useQuickActionStore((state) => state.isShowSide);

  return (
    <div className="float-quick-action-btn">
      <div className="inner">
        {/* 左边的快捷指令按钮列表 */}
        <div className="action-btn-wrapper">
          {/* 最左边的refly.ai图标按钮，点时可以打开侧边栏 */}
          <span className="logo-btn" onClick={() => updateUIState({ isShowSide: !isShowSide })}>
            <img src={Logo} alt="Refly" />
          </span>
          <div className="action-btn-box">
            <div
              className="action-btn"
              onClick={() => {
                updateUIState({
                  popupVisible: true,
                  quickActionToolbarVisible: false,
                });
              }}
            >
              {/* <Icon
        type={quickAction?.iconName?.trim()}
        style={{
          width: 16,
          height: 28,
          display: 'flex',
          alignItems: 'center',
        }}
      /> */}
              <span>添加到聊天</span>
            </div>
            <div
              className="action-btn"
              onClick={() => {
                updateUIState({
                  popupVisible: true,
                  quickActionToolbarVisible: false,
                });
              }}
            >
              {/* <Icon
         type={quickAction?.iconName?.trim()}
         style={{
           width: 16,
           height: 28,
           display: 'flex',
           alignItems: 'center',
         }}
       /> */}
              <span>快捷操作</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
