import { Popover } from "antd"
import { SiderLayout } from "@/components/layout/sider"

interface SiderPopoverProps {
  children: React.ReactNode
}
const SiderPopover = (props: SiderPopoverProps) => {
  const { children } = props

  return (
    <Popover
      overlayInnerStyle={{ padding: 0 }}
      arrow={false}
      placement="bottom"
      content={<SiderLayout source="popover" />}>
      {children}
    </Popover>
  )
}

export default SiderPopover
