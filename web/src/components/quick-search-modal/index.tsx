import { Modal } from "@arco-design/web-react"

// components
import { SearchBox } from "@/components/search-box"
import { useQuickSearchStateStore } from "@/stores/quick-search-state"

export const QuickSearchModal = () => {
  const quickSearchStateStore = useQuickSearchStateStore()
  return (
    <Modal
      visible={quickSearchStateStore.visible}
      closable={false}
      maskClosable={true}
      onCancel={() => {
        quickSearchStateStore.setVisible(false)
      }}
      style={{ width: 800, backgroundColor: "#f3f3ee", borderRadius: 12 }}
      maskStyle={{ background: `rgba(0, 0, 0, .9)` }}
      footer={null}>
      <SearchBox />
    </Modal>
  )
}
