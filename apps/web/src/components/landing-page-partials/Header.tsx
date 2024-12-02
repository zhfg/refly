import Logo from "@/assets/logo.svg"
import { Button } from "antd"
import { useUserStoreShallow } from "@refly-packages/ai-workspace-common/stores/user"

function Header() {
  const { setLoginModalVisible } = useUserStoreShallow(state => ({
    setLoginModalVisible: state.setLoginModalVisible,
  }))
  return (
    <div className="fixed top-0 z-20 flex w-full !justify-center px-6 backdrop-blur-lg sm:px-2 md:px-2 lg:px-0">
      <div className="relative flex w-full max-w-4xl items-center justify-between py-4">
        <div className="mr-4 shrink-0" style={{ height: 45 }}>
          <div className="flex flex-row items-center">
            <img src={Logo} style={{ width: 35 }} />
            <span style={{ fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>
              Refly
            </span>
          </div>
        </div>

        <Button
          type="primary"
          onClick={() => {
            setLoginModalVisible(true)
          }}>
          登录
        </Button>
      </div>
    </div>
  )
}

export default Header
