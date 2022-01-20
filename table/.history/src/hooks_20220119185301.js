import React, { memo, useEffect,useState } from 'react';
import axios from './axios';

export function useAxios(config){
  const [data, setdata] = useState()
  const [loading, setloading] = useState(true)
  const [error, seterror] = useState()
  const [i, setI] = useState(0)
  useEffect(() => {
    const CancelToken = axios.CancelToken
    //axios如果从'./axios'引入则读取不到CancelToken
    const source = CancelToken.source()
    var req = axios({
      ...config,
      cancelToken: source.token,
    })
    req.then(res=>{
      if(res.data.code===0){
        setdata(res.data)
      }else{
        seterror(res.data.msg)
      }
      setloading(false)
    }).catch(e=>{
      seterror('400:',e.toString())
      setloading(false)
    })
    return () => source.cancel()
  }, [config.url,i])
  function update(){
    setI(i+1)
  }
  return {data,loading,error,update}
}
