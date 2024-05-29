import { Card } from "@arco-design/web-react";
import { IconClose, IconRightCircle } from "@arco-design/web-react/icon";
import { useContentSelector } from "@/src/hooks/use-content-selector";
import { useContentSelectorStore } from "@/src/stores/content-selector";
import type { Mark } from "@/src/types/content-selector";

// assets
import EmptySVG from "~assets/selected-content/empty.svg";
import classNames from "classnames";
import { useEffect } from "react";
import { useSelectedMark } from "@/src/hooks/use-selected-mark";
import { useTranslation } from "react-i18next";
// styles
import "./index.scss";

interface SelectedContentListProps {
  marks: Mark[];
  limitContainer?: boolean; // 是否限制高度滚动，用于在会话详情页
}

export const SelectedContentList = (props: SelectedContentListProps) => {
  const { limitContainer = false } = props;
  const { marks = [] } = useContentSelectorStore();
  const { handleExit, handleRemoveAll, handleResetState, handleRemoveMark } =
    useSelectedMark();

  const { t } = useTranslation();

  // 退出时，清理对应的状态
  useEffect(() => {
    return () => {
      handleResetState();
    };
  }, []);

  return (
    <div
      className={classNames("selected-content-container", {
        "selected-container-limit-container": limitContainer,
      })}
    >
      <div className="selected-content-hint-item">
        <div className="selected-content-left-hint">
          <IconRightCircle style={{ color: "rgba(0, 0, 0, .6)" }} />
          <span>{t("loggedHomePage.homePage.selectedContent.title")}</span>
        </div>
        <div className="selected-content-right-hint">
          {marks?.length > 0 ? (
            <span onClick={() => handleRemoveAll()} style={{ marginRight: 12 }}>
              {t("loggedHomePage.homePage.selectedContent.clear")}
            </span>
          ) : null}
          <span onClick={() => handleExit()}>
            {t("loggedHomePage.homePage.selectedContent.exit")}
          </span>
        </div>
      </div>
      <div className="selected-content-list-container">
        {marks.map((item, index) => (
          <Card
            key={index}
            style={{ width: "100%" }}
            extra={
              <IconClose
                className="selected-content-item-action"
                onClick={() => handleRemoveMark(item?.xPath)}
              />
            }
          >
            <span className="selected-content-item">{item?.data}</span>
          </Card>
        ))}
        {marks.length === 0 ? (
          <div className="empty-cover-container">
            <img
              src={EmptySVG}
              className="empty-cover"
              style={limitContainer ? { width: 60 } : { width: 100 }}
            />
            <div>{t("loggedHomePage.homePage.selectedContent.empty")}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
