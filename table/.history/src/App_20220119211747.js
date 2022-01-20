import React, { memo, useEffect } from 'react';
import {useAxios} from './hooks'
import { Table, Tag, Space } from 'antd';

export default memo(function App() {
  const {data,loading,error,update} = useAxios()
  console.log(data);
  
  return <div>
    <Table></Table>
  </div>;
});

