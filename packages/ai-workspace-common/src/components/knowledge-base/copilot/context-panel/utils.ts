import { TreeProps } from '@arco-design/web-react';
import { Collection, Canvas, Resource, SearchDomain } from '@refly/openapi-schema';

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

export const initialCheckedKeys = ['currentPage-resource', 'currentPage-collection', 'currentPage-canvas'];
export const initalExpandedKeys = ['currentPage', 'resource', 'collection', 'canvas', 'weblink'];
export const getTotalRealCheckedContext = (checkedKeys: string[]) => {
  const filteredKeys = checkedKeys.filter((key) => {
    if (initalExpandedKeys.includes(key)) {
      return false;
    }

    return true;
  });

  return filteredKeys?.length || 0;
};

export const buildEnvContext = (currentKnowledgeBase: Collection, currentResource: Resource, currentCanvas: Canvas) => {
  let envContextArr = [];

  if (currentResource?.resourceId) {
    envContextArr.push({
      title: `当前资源：${currentResource?.title}`,
      key: `currentPage-resource`,
    });
  }
  if (currentKnowledgeBase?.collectionId) {
    envContextArr.push({
      title: `当前知识库：${currentKnowledgeBase?.title}`,
      key: `currentPage-collection`,
    });
  }
  if (currentCanvas?.canvasId) {
    envContextArr.push({
      title: `当前笔记：${currentCanvas?.title}`,
      key: `currentPage-note`,
    });
  }

  return envContextArr;
};

export const getCurrentEnvContext = (
  checkedKeys: string[],
  { resource, collection, canvas }: { resource?: Resource; collection?: Collection; canvas?: Canvas } = {},
): { title: string; key: SearchDomain; data?: Resource | Collection | Canvas }[] => {
  const envContextArr = [];
  if (checkedKeys.includes('currentPage-resource')) {
    envContextArr.push({
      title: `当前资源`,
      key: `resource`,
      data: resource,
    });
  }
  if (checkedKeys.includes('currentPage-collection')) {
    envContextArr.push({
      title: `当前知识库`,
      key: `collection`,
      data: collection,
    });
  }
  if (checkedKeys.includes('currentPage-canvas')) {
    envContextArr.push({
      title: `当前笔记`,
      key: `canvas`,
      data: canvas,
    });
  }

  return envContextArr;
};
