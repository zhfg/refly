import { IconDelete, IconMore } from '@arco-design/web-react/icon';
import { Dropdown, Menu, Button, Popconfirm, Message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
// 类型
import { Note } from '@refly/openapi-schema';
// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '@refly-packages/ai-workspace-common/stores/note';
import { useNoteTabs } from '@refly-packages/ai-workspace-common/hooks/use-note-tabs';

const iconStyle = {
  marginRight: 8,
  fontSize: 16,
  transform: 'translateY(1px)',
};

interface DropListProps {
  handleCancel: (e: any) => void;
  handleDeleteClick: (e: any) => void;
}

const DropList = (props: DropListProps) => {
  const { handleCancel, handleDeleteClick } = props;

  return (
    <Menu>
      <Menu.Item key="1">
        <Popconfirm
          focusLock
          title="确定删除该笔记吗？"
          position="br"
          onOk={(e) => {
            handleDeleteClick(e);
          }}
          onCancel={(e) => {
            handleCancel(e);
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <IconDelete style={iconStyle} />
            删除
          </div>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );
};

interface NoteDropdownMenuProps {
  note: Note;
  postDeleteNote?: (note: Note) => void;
}

export const NoteDropdownMenu = (props: NoteDropdownMenuProps) => {
  const { note, postDeleteNote } = props;
  const [popupVisible, setPopupVisible] = useState(false);

  const handleDeleteClick = async (e: MouseEvent) => {
    e.stopPropagation();
    const { error } = await getClient().deleteNote({ body: { noteId: note.noteId } });
    setPopupVisible(false);

    if (error) {
      console.error(error);
      Message.error({ content: `删除失败` });
    } else {
      Message.success({ content: '删除成功' });
    }

    if (postDeleteNote) {
      postDeleteNote(note);
    }
  };

  const handleCancel = (e: MouseEvent) => {
    e.stopPropagation();
    setPopupVisible(false);
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    setPopupVisible(!popupVisible);
  };

  const droplist = DropList({ handleCancel, handleDeleteClick });

  return (
    <Dropdown
      position="br"
      popupVisible={popupVisible}
      droplist={droplist}
      triggerProps={{ onClickOutside: () => setPopupVisible(false) }}
    >
      <Button
        icon={<IconMore style={{ fontSize: 16 }} />}
        type="text"
        onClick={(e) => handleIconClick(e)}
        className="text-gray-500"
      ></Button>
    </Dropdown>
  );
};
