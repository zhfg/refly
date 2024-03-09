export type User = {
  id: string
  /**
   * 头像
   */
  avatar: string | null
  /**
   * 是否安装了扩展
   */
  extensionInstalled: boolean
  /**
   * 邀请码
   */
  inviteCode: string | null
  /**
   * 邀请人数
   */
  inviteCount: number
  /**
   * 用户名
   */
  name: string | null
  /**
   * 邮箱
   */
  email: string | null
  /**
   * 邮箱是否已验证
   */
  emailVerified: Date | null
  /**
   * 密码
   */
  password: string | null
  /**
   * 头像
   */
  image: string | null
  /**
   * 语言偏好列表
   */
  languagePreferences: string[]
  /**
   * 当前语言环境
   */
  locale: string
  /**
   * 禁用的功能列表
   */
  disabledCeatures: string[]
  /**
   * 创建时间
   */
  createdAt: Date
  /**
   * 更新时间
   */
  updatedAt: Date
}
