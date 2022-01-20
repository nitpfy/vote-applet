import React, { memo, useEffect } from 'react';
import {useAxios} from './hooks'
import { Table, Tag, Space } from 'antd';

export default memo(function App() {
  const {data,loading,error,update} = useAxios({url:'http://www.mocky.io/v2/5ea28891310000358f1ef182'})
  if(loading) return loading
  if(error) console.log('error:',error);
  console.log('data:',data);
  
  return <div>
    <Table></Table>
  </div>;
});

