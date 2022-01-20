import React, { memo, useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import { Table, Tag, Space } from 'antd';
import {useAxios} from './hooks'

export default memo(function App() {
  const {data,loading,error} = useAxios({url:'http://www.mocky.io/v2/5ea28891310000358f1ef182'})
  const [datas, setdatas] = useState()
  useEffect(()=>{
    setdatas(data?.apis.map((it,idx)=>({...it,key:idx})))
  },[data])
  if(loading) return loading
  if(error) console.log('error:',error);
  
  console.log('datas:',datas);
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
      render: text => <p width='300px'>{text}</p>,
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: img => <img src={img} alt='null'></img>,
    },
    {
      title: 'Url',
      dataIndex: 'baseURL',
      key: 'url',
      render: url => <a href={url}>链接</a>,
    },
    {
      title: 'Tags',
      key: 'tags',
      dataIndex: 'tags',
      render: tags => (
        <>
          {tags.map(tag => {
            let color = tag.length > 5 ? 'geekblue' : 'green';
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
    <Table columns={columns} dataSource={datas} />
  </div>
  );
});

