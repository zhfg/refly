import md5 from "md5"
import { v4 as UUIDV4 } from "uuid"

export const genUniqueId = () => {
  const uuid = UUIDV4()
  const timestamp = new Date().getTime()
  const randomString =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  const id = `${uuid}${timestamp}${randomString}`
  return md5(id)
}
