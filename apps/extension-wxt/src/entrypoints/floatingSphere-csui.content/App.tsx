import { useEffect, useRef, useState } from 'react';
import { Button, Tooltip, Trigger } from '@arco-design/web-react';

import { reflyEnv } from '@/utils/env';

import { useSiderStore } from '@/stores/sider';
import Logo from '@/assets/logo.svg';
import './App.scss';
import classNames from 'classnames';
import { IconBulb, IconHighlight, IconSave } from '@arco-design/web-react/icon';

const getPopupContainer = () => {
  const elem = document
    .querySelector('refly-float-sphere')
    ?.shadowRoot?.querySelector('.refly-floating-sphere-entry-container');

  return elem as HTMLElement;
};

export const App = () => {
  const siderStore = useSiderStore();
  const [selectedText, setSelectedText] = useState<string>('');
  // 加载快捷键
  const [shortcut, setShortcut] = useState<string>(reflyEnv.getOsType() === 'OSX' ? '⌘ J' : 'Ctrl J');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ y: 0 });
  const sphereRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ y: 0, offsetY: 0 });
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('top');
  const [isHovered, setIsHovered] = useState(false);
  const bottomDistanceRef = useRef(0);

  const updateSpherePosition = (newY: number) => {
    if (sphereRef.current) {
      const sphereHeight = sphereRef.current.offsetHeight;
      const maxY = window.innerHeight - sphereHeight;
      const clampedY = Math.max(0, Math.min(newY, maxY));
      setPosition({ y: clampedY });
      bottomDistanceRef.current = window.innerHeight - clampedY - sphereHeight;
    }
  };

  useEffect(() => {
    // 设置初始位置
    bottomDistanceRef.current = window.innerHeight * 0.25; // 距离底部 25% 的位置
    const initialY = window.innerHeight - bottomDistanceRef.current - (sphereRef.current?.offsetHeight || 0);
    updateSpherePosition(initialY);

    const handleResize = () => {
      const newY = window.innerHeight - bottomDistanceRef.current - (sphereRef.current?.offsetHeight || 0);
      updateSpherePosition(newY);
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && sphereRef.current) {
        const dy = e.clientY - dragStartPos.current.y;
        const newY = dragStartPos.current.offsetY + dy;
        updateSpherePosition(newY);
        updateDropdownPosition();
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const updateDropdownPosition = () => {
    if (sphereRef.current && dropdownRef.current) {
      const sphereRect = sphereRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const topSpace = sphereRect.top;
      const bottomSpace = window.innerHeight - sphereRect.bottom;

      console.log('topSpace', topSpace);
      console.log('bottomSpace', bottomSpace);
      console.log('dropdownHeight', dropdownHeight);

      if (bottomSpace < dropdownHeight + 8) {
        setDropdownPosition('top');
      } else if (topSpace < dropdownHeight + 8) {
        setDropdownPosition('bottom');
      } else {
        setDropdownPosition('top'); // 默认显示在下方
      }
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      y: e.clientY,
      offsetY: position.y,
    };
    e.preventDefault();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    updateDropdownPosition();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  console.log('dropdownPosition', dropdownPosition);
  const Dropdown = () => {
    return (
      <div
        className={`refly-floating-sphere-dropdown ${dropdownPosition}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          right: 4,
        }}
      >
        {/* Dropdown menu content */}
        <div className="refly-floating-sphere-dropdown-connector" />
        <div className="refly-floating-sphere-dropdown-menu" ref={dropdownRef}>
          <Tooltip content="总结此页面" position="left" getPopupContainer={getPopupContainer}>
            <Button
              type="text"
              shape="circle"
              icon={<IconBulb />}
              size="small"
              className="refly-floating-sphere-dropdown-item assist-action-item"
            ></Button>
          </Tooltip>
          <Tooltip content="选择内容提问" position="left" getPopupContainer={getPopupContainer}>
            <Button
              type="text"
              shape="circle"
              icon={<IconHighlight />}
              size="small"
              className="refly-floating-sphere-dropdown-item assist-action-item"
            ></Button>
          </Tooltip>
          <Tooltip content="保存到 Refly" position="left" getPopupContainer={getPopupContainer}>
            <Button
              type="text"
              shape="circle"
              icon={<IconSave />}
              size="small"
              className="refly-floating-sphere-dropdown-item assist-action-item"
            ></Button>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <div className="refly-floating-sphere-entry-container">
      <div
        ref={sphereRef}
        className={classNames('refly-floating-sphere-entry', { active: !!selectedText || isDragging || isHovered })}
        style={{
          top: `${position.y}px`,
          right: '0px',
        }}
      >
        <div className={classNames('refly-floating-sphere-entry-wrapper')}>
          <div
            className={classNames('refly-floating-sphere-entry-content', {
              active: !!selectedText || isDragging || isHovered,
            })}
            onMouseDown={handleDragStart}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(_) => siderStore.setShowSider(!siderStore.showSider)}
          >
            <img src={Logo} alt="唤起 Refly" style={{ width: 25, height: 25 }} />
            <span className="refly-floating-sphere-entry-shortcut">{shortcut}</span>
          </div>

          {/* <Dropdown /> */}
          {(isHovered || isDragging) && <Dropdown />}
        </div>
      </div>
    </div>
  );
};
