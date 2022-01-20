import React, { memo, useEffect, useState } from 'react';
import {useAxios} from './hooks'
import { Table, Tag, Space } from 'antd';

export default memo(function App() {
  const {data,loading,error,update} = useAxios({url:'http://www.mocky.io/v2/5ea28891310000358f1ef182'})
  const [dataSource, setdataSource] = useState()
  if(loading) return loading
  if(error) console.log('error:',error);
  console.log('data:',data);
  setdataSource(data.apis)
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Url',
      dataIndex: 'url',
      key: 'url',
      render: text => <a>{text}</a>,
    },
    {
      title: 'Tags',
      key: 'tags',
      dataIndex: 'tags',
      render: tags => (
        <>
          {tags.map(tag => {
            let color = tag.length > 5 ? 'geekblue' : 'green';
            if (tag === 'loser') {
              color = 'volcano';
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: 'Properties',
      key: 'properties',
      render: (text, record) => (
        <Space size="middle">
          <a>Invite {record.name}</a>
        </Space>
      ),
    },
  ];
  return (
  <div>
    <Table columns={columns} dataSource={dataSource} />
  </div>
  );
});

