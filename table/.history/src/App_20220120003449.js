import React, { memo, useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import { Table, Tag, Space, Modal, Button } from 'antd';
import {useAxios} from './hooks'

const Cpn = (props) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  return (
    <>
      <Button type="primary" onClick={showModal}>
        {props.text}
      </Button>
      <Modal title="Basic Modal" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </>
  );
};

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
      width:'300px',
      render: text => <p>{text}</p>,
      onCell: () => {
        return {
          style: {
            maxWidth: 300,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow:'ellipsis',
            
          }
        }
      },
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
      render: url => <a href={url}>{url}</a>,
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
      dataIndex: 'properties',
      render: (text, record) => (
        <button></button>
      ),
    },
  ];
  return (
  <div>
    <Table columns={columns} dataSource={datas} onRow={record => {
    return {
      onMouseEnter: e => {e.target.ellipsis=false}, // 鼠标移入行
      onMouseLeave: e => {e.target.ellipsis=true},
    };
  }}/>
  </div>
  );
});

