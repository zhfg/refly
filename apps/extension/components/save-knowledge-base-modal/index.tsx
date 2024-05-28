import {
  Form,
  Modal,
  Input,
  Select,
  Typography,
  Message as message,
} from "@arco-design/web-react"
import { sendToBackground } from "@plasmohq/messaging"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { fakeKnowledgeBaseList } from "~fake-data/knowledge-base"
import { useStoreWeblink } from "~hooks/use-store-weblink"
import { useKnowledgeBaseStore } from "~stores/knowledge-base"
import { delay } from "~utils/delay"
import { safeParseJSON } from "~utils/parse"
import { getPopupContainer } from "~utils/ui"

// requests
import newResource from "~requests/newResource"
import { ResourceType, type ResourceListItem } from "~types"

const FormItem = Form.Item
const Option = Select.Option

export type KnowledgeBaseLocation =
  | "lastSaved"
  | "newlyKnowledgeBase"
  | "selectedKnowledgeBase"
export interface KnowledgeBaseLocationValue {
  value: KnowledgeBaseLocation
}

export const SaveKnowledgeBaseModal = () => {
  // 这里前端持久化上次的保存知识库信息
  const lastSavedKnowledgeBaseStr = localStorage.getItem(
    "lastSavedKnowledgeBase",
  )
  const { t } = useTranslation()
  const lastSavedKnowledgeBase = safeParseJSON(lastSavedKnowledgeBaseStr)
  const { handleClientUploadHtml } = useStoreWeblink()
  const selectOptions = lastSavedKnowledgeBase
    ? [
        {
          label: "lastSaved",
          value: "上次保存",
        },
        {
          label: "newlyKnowledgeBase",
          value: "新建知识库",
        },
        {
          label: "selectedKnowledgeBase",
          value: "选择知识库",
        },
      ]
    : [
        {
          label: "newlyKnowledgeBase",
          value: "新建知识库",
        },
        {
          label: "selectedKnowledgeBase",
          value: "选择知识库",
        },
      ]

  const [confirmLoading, setConfirmLoading] = useState(false)
  const [form] = Form.useForm()
  const knowledgeBaseStore = useKnowledgeBaseStore()
  const selectedStoreMannagerState = (Form.useFormState(
    "knowledge-base-location",
    form,
  ) || { value: selectOptions?.[0]?.label }) as { value: string }

  console.log("selectedStoreMannagerState", selectedStoreMannagerState)

  const formItemLayout = {
    labelCol: {
      span: 4,
    },
    wrapperCol: {
      span: 20,
    },
  }

  const onOk = async () => {
    try {
      const validateRes = await form.validate()
      setConfirmLoading(true)

      const weblinkRes = await handleClientUploadHtml(location?.href)
      if (!weblinkRes?.data?.storageKey) {
        message?.error("保存资源失败，请重试！")
        return
      }

      console.log("weblinkRes", weblinkRes)

      const weblinkData = {
        title: document?.title || "",
        url: location.href,
        storageKey: weblinkRes?.data?.storageKey || "",
      }

      let body: ResourceListItem = {
        resourceType: ResourceType.weblink,
        data: weblinkData,
      }
      const knowledgeBaseLocation = form.getFieldValue(
        "knowledge-base-location",
      )
      console.log("knowledgeBaseLocation", knowledgeBaseLocation)
      if (knowledgeBaseLocation === "newlyKnowledgeBase") {
        const collectionName = form.getFieldValue("new-knowledge-base-title")
        body = { ...body, collectionName }
      } else if (knowledgeBaseLocation === "selectedKnowledgeBase") {
        const collectionId = form.getFieldValue("select-knowledge-base")
        body = { ...body, collectionId }
      }

      const resourceRes = await newResource({
        body,
      })

      console.log("resourceRes", resourceRes)
      if (!resourceRes?.success) {
        message?.error("保存资源失败，请重试！")
      } else {
        message.success({
          content: `保存资源成功，可以点击链接访问`,
        })
        knowledgeBaseStore.updateIsSaveKnowledgeBaseModalVisible(false)
      }
    } catch (err) {}

    await delay(3000)
    setConfirmLoading(false)
  }

  const loadMore = async (currentPage?: number) => {
    const { isRequesting, hasMore, pageSize, ...extraState } =
      useKnowledgeBaseStore.getState()
    console.log("loadMore", isRequesting, hasMore, pageSize, extraState)
    if (isRequesting || !hasMore) return
    if (currentPage < extraState?.currentPage) return

    // 获取数据
    const queryPayload = {
      pageSize,
      page:
        typeof currentPage === "number" ? currentPage : extraState.currentPage,
    }

    // 更新页码
    knowledgeBaseStore.updateCurrentPage(
      (typeof currentPage === "number" ? currentPage : extraState.currentPage) +
        1,
    )
    knowledgeBaseStore.updateIsRequesting(true)

    const res = await sendToBackground({
      name: "getKnowledgeBaseList",
      body: queryPayload,
    })

    console.log("res", res)

    if (!res?.success) {
      message.error(
        t("translation:loggedHomePage.homePage.weblinkList.list.fetchErr"),
      )
      knowledgeBaseStore.updateIsRequesting(false)

      return
    }

    // 处理分页
    if (res?.data?.length < pageSize) {
      knowledgeBaseStore.updateHasMore(false)
    }

    console.log("res", res)
    knowledgeBaseStore.updateKnowledgeBaseList(res?.data || [])
    knowledgeBaseStore.updateIsRequesting(false)
  }

  useEffect(() => {
    form.setFieldValue(
      "knowledge-base-location",
      selectedStoreMannagerState?.value,
    )
  }, [])

  useEffect(() => {
    if (knowledgeBaseStore?.isSaveKnowledgeBaseModalVisible) {
      loadMore(1)
    }
  }, [knowledgeBaseStore?.isSaveKnowledgeBaseModalVisible])
  useEffect(() => {
    return () => {
      console.log("exit exit")
      knowledgeBaseStore.resetState()
    }
  }, [])

  return (
    <Modal
      title="保存资源到知识库"
      style={{ width: "80%" }}
      unmountOnExit={true}
      escToExit
      getPopupContainer={() =>
        document
          .querySelector("#refly-main-app")
          ?.shadowRoot?.querySelector(".main")
      }
      visible={knowledgeBaseStore.isSaveKnowledgeBaseModalVisible}
      onOk={() => onOk()}
      okButtonProps={{ loading: confirmLoading }}
      confirmLoading={confirmLoading}
      onCancel={() => {
        knowledgeBaseStore.resetState()
        knowledgeBaseStore.updateIsSaveKnowledgeBaseModalVisible(false)
      }}>
      <Form
        layout="vertical"
        {...formItemLayout}
        form={form}
        labelCol={{
          style: { flexBasis: 90 },
        }}
        onChange={(value) => {}}
        wrapperCol={{
          style: { flexBasis: "calc(100% - 90px)" },
        }}>
        <FormItem
          label="保存位置"
          required
          field="knowledge-base-location"
          rules={[{ required: true }]}>
          <Select>
            {selectOptions.map((item, index) => {
              return (
                <Option key={item?.label} value={item?.label}>
                  {item?.value}
                </Option>
              )
            })}
          </Select>
        </FormItem>
        {(selectedStoreMannagerState as KnowledgeBaseLocationValue)?.value ===
        "selectedKnowledgeBase" ? (
          knowledgeBaseStore?.knowledgeBaseList?.length > 0 ? (
            <FormItem
              label="选择知识库"
              required
              field="select-knowledge-base"
              rules={[{ required: true, message: "知识库是必填项" }]}>
              <Select allowClear showSearch>
                {knowledgeBaseStore?.knowledgeBaseList.map((option) => (
                  <Option
                    key={option?.collectionId}
                    value={option?.collectionId}>
                    {option?.title}
                  </Option>
                ))}
              </Select>
            </FormItem>
          ) : (
            <Typography.Paragraph blockquote>
              您还未创建知识库，点击保存将自动为您创建一个默认知识库！
            </Typography.Paragraph>
          )
        ) : null}
        {(selectedStoreMannagerState as KnowledgeBaseLocationValue)?.value ===
        "lastSaved" ? (
          <FormItem
            label="保存位置"
            required
            field="last-save-knowledge-base"
            defaultValue={lastSavedKnowledgeBase?.title}
            rules={[{ required: true }]}>
            <Select defaultValue={lastSavedKnowledgeBase?.title}>
              {[lastSavedKnowledgeBase].map((option) => (
                <Option key={option?.collectionId} value={option?.title}>
                  {option?.title}
                </Option>
              ))}
            </Select>
          </FormItem>
        ) : null}
        {(selectedStoreMannagerState as KnowledgeBaseLocationValue)?.value ===
        "newlyKnowledgeBase"
          ? [
              <FormItem
                label="知识库名称"
                required
                field="new-knowledge-base-title"
                initialValue={document?.title || ""}
                rules={[{ required: true }]}>
                <Input />
              </FormItem>,
              <Typography.Paragraph blockquote>
                将会以当前网页内容信息创建新知识库
              </Typography.Paragraph>,
            ]
          : null}
      </Form>
    </Modal>
  )
}
