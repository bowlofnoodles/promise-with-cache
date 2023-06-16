import { uuidGenerate } from './tools';
interface RequestCallback {
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
}

// 存放等待状态的请求回调
const callbackMap = new Map<string, RequestCallback[]>();

// 异步任务状态缓存
const statusMap = new Map<string, 'pending' | 'complete'>();

// 实际数据缓存
const cacheMap = new Map<string, Record<string, any>>();

class CachePromise<T = any> {
  private promiseFunc: () => Promise<T>;

  private cacheKey: string;

  private generateCacheKey() {
    return uuidGenerate();
  }

  /**
   * 静态方法-指定key清空缓存，如果不传则全部清空
   */
  static clearCache(cacheKey?: string) {
    if (cacheKey == void 0) {
      callbackMap.clear();
      statusMap.clear();
      cacheMap.clear();
    } else {
      callbackMap.delete(cacheKey);
      statusMap.delete(cacheKey);
      cacheMap.delete(cacheKey);
    }
  }

  /**
   * 并发异步任务缓存
   *
   * @param promiseFunc 返回值是个promise的函数
   * @param cacheKey 缓存key，如果不指定静态cacheKey的话，那只能实例化一次（缓存key会在实例化生成）
   */
  constructor(promiseFunc: () => Promise<T>, cacheKey?: string) {
    this.promiseFunc = promiseFunc;
    this.cacheKey = cacheKey ?? this.generateCacheKey();
  }

  /**
   * 调用get方法，执行异步任务，缓存存在时会取缓存，如果有并发任务时，会等待上一个并发任务结束再取缓存
   */
  get = (): Promise<T> => {
    if (!this.cacheKey || typeof this.promiseFunc !== 'function') {
      const paramsError = new Error('cacheKey or promiseFunc can not be empty');
      if (__DEV__) {
        console.error(paramsError);
      }
      return Promise.reject(paramsError);
    }
    if (statusMap.has(this.cacheKey)) {
      const currentStatus = statusMap.get(this.cacheKey);

      // 判断当前的接口缓存状态，如果是 complete ，则代表缓存完成
      if (currentStatus === 'complete') {
        return Promise.resolve(cacheMap.get(this.cacheKey) as T);
      }

      // 如果是 pending ，则代表正在请求中，这里放入回调函数
      if (currentStatus === 'pending') {
        return new Promise((resolve, reject) => {
          if (callbackMap.has(this.cacheKey)) {
            callbackMap.get(this.cacheKey)!.push({
              onSuccess: resolve,
              onError: reject
            });
          } else {
            callbackMap.set(this.cacheKey, [
              {
                onSuccess: resolve,
                onError: reject
              }
            ]);
          }
        });
      }
    }

    statusMap.set(this.cacheKey, 'pending');

    return this.promiseFunc().then(
      res => {
        statusMap.set(this.cacheKey, 'complete');
        cacheMap.set(this.cacheKey, res as any);
        // 触发resolve的回调函数
        if (callbackMap.has(this.cacheKey)) {
          callbackMap.get(this.cacheKey)!.forEach(callback => {
            callback.onSuccess(res);
          });
          // 调用完成之后清掉，用不到了
          callbackMap.delete(this.cacheKey);
        }
        return res;
      },
      error => {
        // 不成功的情况下删掉 statusMap 中的状态，能让下次请求重新请求
        statusMap.delete(this.cacheKey);
        // 这里触发reject的回调函数
        if (callbackMap.has(this.cacheKey)) {
          callbackMap.get(this.cacheKey)!.forEach(callback => {
            callback.onError(error);
          });
          // 调用完成之后也清掉
          callbackMap.delete(this.cacheKey);
        }
        // 返回 Promise.reject(error)，才能被catch捕捉到
        return Promise.reject(error);
      }
    );
  };

  /**
   * 获取缓存key
   */
  getCacheKey = () => {
    return this.cacheKey;
  };

  /**
   * 清空缓存
   */
  clearCache = () => {
    if (!this.cacheKey) return;
    callbackMap.delete(this.cacheKey);
    statusMap.delete(this.cacheKey);
    cacheMap.delete(this.cacheKey);
  };

  /**
   * 手动强制执行异步任务-刷新缓存
   */
  forceUpdate = (): Promise<T> => {
    this.clearCache();
    return this.get();
  };
}

export default CachePromise;
