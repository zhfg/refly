import { Tag } from "@arco-design/web-react"
import { IconRightCircle, IconLink } from "@arco-design/web-react/icon"
import React, { type MutableRefObject } from "react"
import { useTranslation } from "react-i18next"
import type { WebLinkItem } from "~components/weblink-list/types"
import { useSearchQuickActionStore } from "~stores/search-quick-action"
import { useWeblinkStore } from "~stores/weblink"
import type { Source } from "~types"

interface SelectedWeblinkProps {
  ref?: MutableRefObject<SelectedWeblinkProps>
  closable: boolean
}

export const SelectedWeblink = (props: SelectedWeblinkProps) => {
  const weblinkStore = useWeblinkStore()
  const searchQuickActionStore = useSearchQuickActionStore()
  const { t } = useTranslation()

  const updateSelectedRow = (link: {
    key: string | number
    content: WebLinkItem
  }) => {
    const { selectedRow } = useWeblinkStore.getState()

    // 去掉删除的 row
    const newSelectedRow = selectedRow.filter(
      (item) => String(item?.key) !== String(link?.key),
    )

    console.log("link", link, newSelectedRow)

    if (newSelectedRow?.length === 0) {
      searchQuickActionStore.setShowQuickAction(false)
    }

    weblinkStore.updateSelectedRow(newSelectedRow)
  }

  return (
    <div className="selected-weblinks-container">
      <div className="selected-weblinks-inner-container">
        <div className="hint-item">
          <IconRightCircle style={{ color: "rgba(0, 0, 0, .6)" }} />
          <span>
            {t("translation:loggedHomePage.homePage.selectedWeblink.title")}
          </span>
        </div>
        {weblinkStore?.selectedRow?.map((item, index) => (
          <Tag
            key={index}
            closable={props.closable}
            visible={true}
            onClose={() => {
              updateSelectedRow(item)
            }}
            icon={<IconLink />}
            bordered
            color="gray">
            <a
              rel="noreferrer"
              href={item?.content?.url}
              target="_blank"
              className="selected-weblink-item">
              <img
                className="icon"
                src={`https://www.google.com/s2/favicons?domain=${item?.content?.origin}&sz=${16}`}
                alt=""
              />
              <span className="text">{item?.content?.originPageTitle}</span>
            </a>
          </Tag>
        ))}
      </div>
    </div>
  )
}
