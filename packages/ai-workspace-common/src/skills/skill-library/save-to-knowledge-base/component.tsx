import {
  Form,
  Modal,
  Input,
  Select,
  Typography,
  Message as message,
} from "@arco-design/web-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { safeParseJSON } from "@refly-packages/ai-workspace-common/utils/parse"
import getClient from "@refly-packages/ai-workspace-common/requests/proxiedRequest"
import { getPopupContainer } from "@refly-packages/ai-workspace-common/utils/ui"
import { delay } from "@refly-packages/ai-workspace-common/utils/delay"
import {
  Resource,
  ResourceType,
  CreateResourceData,
  UpsertResourceRequest,
} from "@refly/openapi-schema"
import { useKnowledgeBaseStore } from "@refly-packages/ai-workspace-common/stores/knowledge-base"
// utils
import { convertHTMLToMarkdown } from "@refly/utils"

// Skills 相关内容
import { useGetCurrentContext } from "@refly-packages/ai-workspace-common/skills/main-logic/use-get-current-context"
import { useDispatchAction } from "@refly-packages/ai-workspace-common/skills/main-logic/use-dispatch-action"
import { skillSpec } from "./index"
import { SkillState } from "./types"

const FormItem = Form.Item
const Option = Select.Option

export type KnowledgeBaseLocation =
  | "lastSaved"
  | "newlyKnowledgeBase"
  | "selectedKnowledgeBase"
export interface KnowledgeBaseLocationValue {
  value: KnowledgeBaseLocation
}

const SaveKnowledgeBaseModal = () => {
  // 通过 hooks 获取当前的 context
  const { currentResource, currentKnowledgeBase, getCurrentSkillState } =
    useGetCurrentContext()
  const { dispatch } = useDispatchAction()

  console.log("modal currentResource", currentResource)

  // 当前 Skill States
  const [isRequesting, setIsRequesting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const currentSkillState = (getCurrentSkillState(skillSpec?.name) ||
    {}) as SkillState

  // 这里前端持久化上次的保存知识库信息
  const lastSavedKnowledgeBaseStr = localStorage.getItem(
    "lastSavedKnowledgeBase",
  )
  const { t } = useTranslation()
  const lastSavedKnowledgeBase = safeParseJSON(lastSavedKnowledgeBaseStr)
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
  ) || {
    value: selectOptions?.[0]?.label,
  }) as { value: string }

  console.log("selectedStoreMannagerState", selectedStoreMannagerState)

  const formItemLayout = {
    labelCol: {
      span: 4,
    },
    wrapperCol: {
      span: 20,
    },
  }

  const onOk = async (currentResource: Resource) => {
    try {
      const validateRes = await form.validate()
      setConfirmLoading(true)

      let createResourceData: CreateResourceData = {
        body: {
          resourceType: "weblink",
          data: currentResource?.data,
          content: convertHTMLToMarkdown(
            "render",
            (currentResource as UpsertResourceRequest)?.content || "",
          ),
        },
      }
      const knowledgeBaseLocation = form.getFieldValue(
        "knowledge-base-location",
      )
      console.log("knowledgeBaseLocation", knowledgeBaseLocation)
      if (knowledgeBaseLocation === "newlyKnowledgeBase") {
        const collectionName = form.getFieldValue("new-knowledge-base-title")
        createResourceData.body = { ...createResourceData.body, collectionName }
      } else if (knowledgeBaseLocation === "selectedKnowledgeBase") {
        const collectionId = form.getFieldValue("select-knowledge-base")
        createResourceData.body = { ...createResourceData.body, collectionId }
      }

      const { data } = await getClient().createResource(createResourceData)

      console.log("resourceRes", data)
      if (!data?.success) {
        message?.error("保存资源失败，请重试！")
      } else {
        message.success({
          content: `保存资源成功，可以点击链接访问`,
        })
        dispatch({
          type: "state",
          name: skillSpec.name,
          body: {
            modalVisible: false,
          },
        })
      }
    } catch (err) {}

    await delay(3000)
    setConfirmLoading(false)
  }

  useEffect(() => {
    form.setFieldValue(
      "knowledge-base-location",
      selectedStoreMannagerState?.value,
    )
  }, [])

  // 目前先这样，TODO: 后续应该变成 onDemand 获取，基于 OpenAPI
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
    setCurrentPage(
      (typeof currentPage === "number" ? currentPage : extraState.currentPage) +
        1,
    )
    setIsRequesting(true)

    const { data: res } = await getClient().listCollections({
      query: queryPayload,
    })

    console.log("res", res)

    if (!res?.success) {
      message.error(t("loggedHomePage.homePage.weblinkList.list.fetchErr"))
      setIsRequesting(false)

      return
    }

    // 处理分页
    if (res?.data?.length < pageSize) {
      setHasMore(false)
    }

    console.log("res", res)
    knowledgeBaseStore.updateKnowledgeBaseList(res?.data || [])
    setIsRequesting(false)
  }

  useEffect(() => {
    if (currentSkillState?.modalVisible) {
      loadMore(1)
    }
  }, [currentSkillState?.modalVisible])
  // useEffect(() => {
  //   return () => {
  //     console.log('exit exit');
  //     knowledgeBaseStore.resetState();
  //   };
  // }, []);

  return (
    <Modal
      title="保存资源到知识库"
      style={{ width: "80%" }}
      unmountOnExit={true}
      escToExit
      getPopupContainer={() => getPopupContainer()}
      visible={currentSkillState?.modalVisible || false}
      onOk={() => onOk(currentResource)}
      okButtonProps={{ loading: confirmLoading }}
      confirmLoading={confirmLoading}
      onCancel={() => {
        // knowledgeBaseStore.resetState();
        dispatch({
          type: "state",
          name: skillSpec.name,
          body: {
            modalVisible: false,
          },
        })
      }}>
      <Form
        layout="vertical"
        {...formItemLayout}
        form={form}
        labelCol={{
          style: { flexBasis: 90 },
        }}
        onChange={value => {}}
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
                {knowledgeBaseStore?.knowledgeBaseList.map(option => (
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
              {[lastSavedKnowledgeBase].map(option => (
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

export default SaveKnowledgeBaseModal
