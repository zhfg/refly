import { Tag } from "@arco-design/web-react";
import { IconRightCircle, IconLink } from "@arco-design/web-react/icon";
import React, { type MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import { useSearchQuickActionStore } from "@/src/stores/search-quick-action";
import { useWeblinkStore } from "@/src/stores/weblink";
import type { Source } from "@/src/types";
import { safeParseUrl } from "@/src/utils/parse";

interface SelectedWeblinkProps {
  ref?: MutableRefObject<SelectedWeblinkProps>;
  closable: boolean;
  selectedWeblinkList: { key: string | number; content: Source }[];
}

export const SelectedWeblink = (props: SelectedWeblinkProps) => {
  const weblinkStore = useWeblinkStore();
  const searchQuickActionStore = useSearchQuickActionStore();
  const { t } = useTranslation();
  const selectedRow = props?.selectedWeblinkList;

  const updateSelectedRow = (link: {
    key: string | number;
    content: Source;
  }) => {
    const { selectedRow } = useWeblinkStore.getState();

    // 去掉删除的 row
    const newSelectedRow = selectedRow.filter(
      (item) => String(item?.key) !== String(link?.key)
    );

    console.log("link", link, newSelectedRow);

    if (newSelectedRow?.length === 0) {
      searchQuickActionStore.setShowQuickAction(false);
    }

    weblinkStore.updateSelectedRow(newSelectedRow);
  };

  return (
    <div className="selected-weblinks-container">
      <div className="selected-weblinks-inner-container">
        <div className="hint-item">
          <IconRightCircle style={{ color: "rgba(0, 0, 0, .6)" }} />
          <span>{t("loggedHomePage.homePage.selectedWeblink.title")}</span>
        </div>
        {selectedRow?.map((item, index) => (
          <Tag
            key={index}
            closable={props.closable}
            visible={true}
            onClose={() => {
              updateSelectedRow(item);
            }}
            icon={<IconLink />}
            bordered
            color="gray"
          >
            <a
              rel="noreferrer"
              href={item?.content?.metadata?.source}
              target="_blank"
              className="selected-weblink-item"
            >
              <img
                className="icon"
                src={`https://www.google.com/s2/favicons?domain=${safeParseUrl(item?.content?.metadata?.source)}&sz=${16}`}
                alt=""
              />
              <span className="text">{item?.content?.metadata?.title}</span>
            </a>
          </Tag>
        ))}
      </div>
    </div>
  );
};
