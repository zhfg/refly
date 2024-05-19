import { Form, Modal, Input, Select, Typography } from "@arco-design/web-react"
import { useEffect, useState } from "react"
import { fakeKnowledgeBaseList } from "~fake-data/knowledge-base"
import { useKnowledgeBaseStore } from "~stores/knowledge-base"
import { delay } from "~utils/delay"
import { safeParseJSON } from "~utils/parse"
import { getPopupContainer } from "~utils/ui"

const FormItem = Form.Item
const Option = Select.Option

export const SaveKnowledgeBaseModal = () => {
  // 这里前端持久化上次的保存知识库信息
  const lastSavedKnowledgeBaseStr = localStorage.getItem(
    "lastSavedKnowledgeBase",
  )
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
  const [knowledgeBaseList, setKnowledgeBaseList] = useState([])
  const selectedStoreMannagerState = (Form.useFormState(
    "knowledge-base-location",
    form,
  ) || { value: selectOptions?.[0]?.value }) as { value: string }

  console.log(
    "selectedStoreMannagerState",
    selectedStoreMannagerState,
    knowledgeBaseList,
  )

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
      knowledgeBaseStore.updateIsSaveKnowledgeBaseModalVisible(false)
    } catch (err) {
      return
    }
  }

  const fetchKnowledgeBaseList = async () => {
    setKnowledgeBaseList(fakeKnowledgeBaseList)
  }

  useEffect(() => {
    form.setFieldValue(
      "knowledge-base-location",
      selectedStoreMannagerState?.value,
    )
    fetchKnowledgeBaseList()
  }, [])

  return (
    <Modal
      title="保存资源到知识库"
      style={{ width: "80%" }}
      getPopupContainer={() =>
        document
          .querySelector("#refly-main-app")
          ?.shadowRoot?.querySelector(".main")
      }
      visible={knowledgeBaseStore.isSaveKnowledgeBaseModalVisible}
      onOk={onOk}
      confirmLoading={confirmLoading}
      onCancel={() =>
        knowledgeBaseStore.updateIsSaveKnowledgeBaseModalVisible(false)
      }>
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
          <Select defaultValue={selectOptions[0]}>
            {selectOptions.map((item, index) => {
              return (
                <Option key={item?.label} value={item?.value}>
                  {item?.value}
                </Option>
              )
            })}
          </Select>
        </FormItem>
        {(selectedStoreMannagerState as any)?.value === "选择知识库" ? (
          <FormItem
            label="选择知识库"
            required
            field="select-knowledge-base"
            rules={[{ required: true, message: "知识库是必填项" }]}>
            <Select
              allowClear
              showSearch
              defaultValue={knowledgeBaseList[0].name}>
              {knowledgeBaseList.map((option) => (
                <Option key={option.id} value={option.name}>
                  {option.name}
                </Option>
              ))}
            </Select>
          </FormItem>
        ) : null}
        {(selectedStoreMannagerState as any)?.value === "上次保存" ? (
          <FormItem
            label="保存位置"
            required
            field="last-save-knowledge-base"
            defaultValue={lastSavedKnowledgeBase?.name}
            rules={[{ required: true }]}>
            <Select defaultValue={lastSavedKnowledgeBase?.name}>
              {[lastSavedKnowledgeBase].map((option) => (
                <Option key={option.id} value={option.name}>
                  {option.name}
                </Option>
              ))}
            </Select>
          </FormItem>
        ) : null}
        {(selectedStoreMannagerState as any)?.value === "新建知识库" ? (
          <Typography.Paragraph blockquote>
            将会以当前网页内容信息创建新知识库
          </Typography.Paragraph>
        ) : null}
      </Form>
    </Modal>
  )
}
