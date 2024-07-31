import { TreeProps } from '@arco-design/web-react';
import { Collection, Resource } from '@refly/openapi-schema';

export function searchData(inputValue, TreeData) {
  const loop = (data) => {
    const result = [];
    data.forEach((item) => {
      if (item.title.toLowerCase().indexOf(inputValue.toLowerCase()) > -1) {
        result.push({ ...item });
      } else if (item.children) {
        const filterData = loop(item.children);

        if (filterData.length) {
          result.push({ ...item, children: filterData });
        }
      }
    });
    return result;
  };

  return loop(TreeData);
}

export function searchDataKeys(inputValue, TreeData: TreeProps['treeData'], key: 'title' | 'key' = 'title') {
  console.log('searchDataKeys', inputValue, TreeData);
  const loop = (data: TreeProps['treeData']) => {
    let result = [];
    data.forEach((item) => {
      if ((item?.[key] as string).toLowerCase().indexOf(inputValue.toLowerCase()) > -1) {
        result = result.concat(item?.key);
      } else if (item.children) {
        const filterData = loop(item.children);

        if (filterData.length) {
          result = result.concat([...filterData]);
        }
      }
    });
    return result;
  };

  return loop(TreeData);
}

export function getSelectedData(selectedKeys, TreeData: TreeProps['treeData']) {
  const loop = (data: TreeProps['treeData']) => {
    const result = [];
    data.forEach((item) => {
      if (selectedKeys.includes(item.key as string)) {
        result.push(item);
      } else if (item.children) {
        const filterData = loop(item.children);

        if (filterData.length) {
          result.push([...filterData]);
        }
      }
    });
    return result;
  };

  return loop(TreeData);
}

export const initialCheckedKeys = [
  'currentPage-currentResource',
  'currentPage-currentKnowledgeBase',
  'currentPage-currentNote',
];
export const initalExpandedKeys = ['currentPage', 'resource', 'knowledgeBase', 'note'];
export const getTotalRealCheckedContext = (checkedKeys: string[]) => {
  const filteredKeys = checkedKeys.filter((key) => {
    if (initalExpandedKeys.includes(key)) {
      return false;
    }

    return true;
  });

  return filteredKeys?.length || 0;
};

export const buildEnvContext = (currentKnowledgeBase: Collection, currentResource: Resource, currentNote: Resource) => {
  let envContextArr = [];

  if (currentResource?.resourceId) {
    envContextArr.push({
      title: `当前资源：${currentResource?.title}`,
      key: `currentPage-currentResource`,
    });
  }
  if (currentKnowledgeBase?.collectionId) {
    envContextArr.push({
      title: `当前知识库：${currentKnowledgeBase?.title}`,
      key: `currentPage-currentKnowledgeBase`,
    });
  }
  if (currentNote?.resourceId) {
    envContextArr.push({
      title: `当前笔记：${currentNote?.title}`,
      key: `currentPage-currentNote`,
    });
  }

  return envContextArr;
};
