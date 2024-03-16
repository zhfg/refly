import { Tag } from "@arco-design/web-react"
import React, { type MutableRefObject } from "react"
import { IconRightCircle, IconLink } from "@arco-design/web-react/icon"
import type { Source } from "@/types"

interface SelectedWeblinkProps {
  ref?: MutableRefObject<SelectedWeblinkProps>
  closable: boolean
  selectedWeblinkList: Source[]
}

export const SelectedWeblink = React.forwardRef(
  (props: SelectedWeblinkProps, ref: any) => {
    return (
      <div className="selected-weblinks-container" ref={ref}>
        <div className="selected-weblinks-inner-container">
          <div className="hint-item">
            <IconRightCircle style={{ color: "rgba(0, 0, 0, .6)" }} />
            <span>基于选中网页提问：</span>
          </div>
          {props.selectedWeblinkList?.map((item, index) => (
            <Tag
              key={index}
              closable={props.closable}
              onClose={() => {}}
              icon={<IconLink />}
              bordered
              color="gray">
              <a
                rel="noreferrer"
                href={item?.metadata?.source}
                target="_blank"
                className="selected-weblink-item">
                <img
                  className="icon"
                  src={`https://www.google.com/s2/favicons?domain=${item?.metadata?.source}&sz=${16}`}
                  alt=""
                />
                <span className="text">{item?.metadata?.title}</span>
              </a>
            </Tag>
          ))}
        </div>
      </div>
    )
  },
)
