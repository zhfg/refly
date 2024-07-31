import { TreeProps } from '@arco-design/web-react';

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

export function searchDataKeys(inputValue, TreeData: TreeProps['treeData']) {
  const loop = (data: TreeProps['treeData']) => {
    const result = [];
    data.forEach((item) => {
      if ((item.title as string).toLowerCase().indexOf(inputValue.toLowerCase()) > -1) {
        result.push(item?.key);
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
