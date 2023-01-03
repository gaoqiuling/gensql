import axios from 'axios'
import { ElMessage } from 'element-plus';

export const request = (method = 'get') => ({
  url,
  data,
  header = {},
  onUploadProgress = () => { },
  encodeURI = false,
  standard = false
}) => {
  return axios({
    timeout: 30000, // 前端请求30秒超时
    method,
    url,
    data,
    header,
    // onUploadProgress,
    // withCredentials: false
  }).then(res => {
    let { status: resStatus, data: resData = {} } = res // axios响应体
    if (resStatus === 200) { // http code 200
      return resData
    }
    throw resData
  }).catch((err = {}) => {
    console.log(err)
    if (err.message === 'Network Error') { // axios网络请求错误时抛出的错误
      ElMessage.error('网络异常，请稍后重试')
      throw {
        ...err,
        message: '请求失败，请稍后重试'
      }
    }
    if (err.message.includes('timeout') || err.code === 'ECONNABORTED') { // axios网络请求超时时抛出的错误
      ElMessage.error('请求超时，请稍后重试')
      throw {
        ...err,
        message: '请求超时，请稍后重试'
      }
    }
    console.log(err)
    throw err
  })
}

export const get = request('get')
export const post = request('post')
export const put = request('put')