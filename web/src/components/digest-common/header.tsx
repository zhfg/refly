import { useDigestStore } from "@/stores/digest"
import { Button, Divider, Radio } from "@arco-design/web-react"
import { IconArchive, IconBulb } from "@arco-design/web-react/icon"

import "./header.scss"
import { useNavigate } from "react-router-dom"
import { getCurrentDateInfo } from "@/utils/time"

interface DigestHeaderProps {
  tab: "today" | "archive"
}

export const DigestHeader = (props: DigestHeaderProps) => {
  const digestStore = useDigestStore()
  const navigate = useNavigate()

  console.log("now tab", props.tab)

  const handleNavigateArchive = (item: "今天" | "归档") => {
    if (item === "今天") {
      navigate("/digest")
    } else if (item === "归档") {
      const { year, month, day } = getCurrentDateInfo()
      navigate(`/digest/daily/${year}/${month}/${day}`)
    }
  }

  return (
    <div className="today-header-container">
      <div className="today-menu">
        <Radio.Group defaultValue={props.tab === "today" ? "今天" : "归档"}>
          {["今天", "归档"].map(item => {
            return (
              <Radio key={item} value={item}>
                {({ checked }) => {
                  return (
                    <Button
                      type="outline"
                      onClick={() =>
                        handleNavigateArchive(item as "今天" | "归档")
                      }
                      icon={item === "今天" ? <IconBulb /> : <IconArchive />}
                      className={`today-menu-item ${checked ? "today-menu-item-checked" : ""}`}>
                      {item}
                    </Button>
                  )
                }}
              </Radio>
            )
          })}
        </Radio.Group>
      </div>
      <Divider type="vertical" />
      <div className="trending-topic-container">
        <div className="trending-topic-title">趋势主题：</div>
        <div className="trending-topics">
          {digestStore?.topic?.data?.map(item => (
            <div className="trending-topic-item">
              <Button>{item?.name}</Button>
            </div>
          ))}
          <div className="trending-topic-item">
            <Button onClick={() => navigate("/digest/topics")}>
              查看全部+{32}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
