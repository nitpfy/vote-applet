import React, { memo, useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import { Table, Tag, Space, Modal, Button, Tooltip } from 'antd';
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
        Proprety
      </Button>
      <Modal title="Basic Modal" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        
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
      sticky:'true'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width:'300px',
      sticky:'true',
      render: text => <Tooltip placement="topLeft" title={text}>{text}</Tooltip>,
      onCell: () => {
        return {
          style: {
            maxWidth: 300,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }
        }
      },
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      sticky:'true',
      width:'200px',
      render: img => <img src={img} alt='null'></img>,
    },
    {
      title: 'Url',
      dataIndex: 'baseURL',
      key: 'url',
      sticky:'true',
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
              <Tag color={color} key={tag} style={{margin:'0px'}}>
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
      align:'center',
      render: (item) => (
        <Cpn item={item}></Cpn>
      ),
    },
  ];
  return (
  <div style={{width:'1120px',margin:'auto'}}>
    <Table columns={columns} dataSource={datas} bordered='true' scroll={{ y: '500px' }}/>
  </div>
  );
});

