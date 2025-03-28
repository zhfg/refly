import { useState, useCallback } from 'react';
import { Canvas } from '@refly/openapi-schema';
import { useTranslation } from 'react-i18next';
import { Collapse, Button, List, Empty, Typography } from 'antd';
import {
  IconMoreHorizontal,
  IconCanvas,
  IconPlus,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { iconClassName } from '@refly-packages/ai-workspace-common/components/project/project-directory';
import cn from 'classnames';

const { Text } = Typography;

export const CanvasMenu = ({ canvasList }: { canvasList: Canvas[] }) => {
  const { t } = useTranslation();

  const [hoveredCanvasId, setHoveredCanvasId] = useState<string | null>(null);

  const handleCanvasHover = useCallback((id: string | null) => {
    setHoveredCanvasId(id);
  }, []);

  const handleAddCanvas = () => {
    console.log('handleAddCanvas');
  };

  return (
    <Collapse
      defaultActiveKey={['canvas']}
      ghost
      expandIconPosition="end"
      className="bg-white custom-collapse"
      items={[
        {
          key: 'canvas',
          label: <span className="text-sm font-medium">{t('project.canvas')}</span>,
          children: (
            <div className="flex flex-col">
              {canvasList.length > 0 && (
                <Button
                  type="text"
                  className="flex items-center justify-start mb-2 mx-3 !text-green-600"
                  icon={<IconPlus className={cn(iconClassName)} />}
                  onClick={handleAddCanvas}
                >
                  {t('loggedHomePage.siderMenu.newCanvas')}
                </Button>
              )}
              <div className="max-h-[20vh] overflow-y-auto px-3">
                <List
                  itemLayout="horizontal"
                  split={false}
                  dataSource={canvasList}
                  locale={{
                    emptyText: (
                      <Empty
                        className="text-xs my-2 "
                        image={null}
                        imageStyle={{
                          display: 'none',
                        }}
                        description={t('common.empty')}
                      >
                        <Button
                          type="default"
                          size="small"
                          className="text-xs text-gray-600"
                          icon={<IconPlus size={12} className="flex items-center justify-center" />}
                          onClick={handleAddCanvas}
                        >
                          {t('loggedHomePage.siderMenu.newCanvas')}
                        </Button>
                      </Empty>
                    ),
                  }}
                  renderItem={(item) => (
                    <List.Item
                      className="!py-2 !px-1 rounded-md hover:bg-gray-50 cursor-pointer"
                      onMouseEnter={() => handleCanvasHover(item.canvasId)}
                      onMouseLeave={() => handleCanvasHover(null)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <IconCanvas className={cn(iconClassName, 'text-gray-500')} />
                          <Text className="w-[120px] text-[13px] text-gray-700 truncate">
                            {item.title}
                          </Text>
                        </div>
                        <div
                          className={cn(
                            'transition-opacity duration-200',
                            hoveredCanvasId === item.canvasId ? 'opacity-100' : 'opacity-0',
                          )}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={
                              <IconMoreHorizontal
                                className={cn(iconClassName, 'text-gray-500 hover:text-green-600')}
                              />
                            }
                          />
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  );
};
