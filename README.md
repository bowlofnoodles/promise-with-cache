# 缓存异步任务(Promise)


## 安装

```bash

npm install --save promise-with-cache

```

## 使用

```javascript
import CachePromise from 'promise-with-cache';

const asyncTaskFunc = () => fetch('/api/some_data')
  .then(res => res.json());

const cachePromise = new CachePromise(asyncTaskFunc);
// const cachePromise = new CachePromise(asyncTaskFunc, 'aCacheKey'); // 也可指定静态缓存标志

async main() {
  // 调用get方法，执行异步任务，缓存存在时会取缓存，如果有并发任务时，会等待上一个并发任务结束再取缓存
  const first = await cachePromise.get();
  const twice = await cachePromise.get();
  const third = await cachePromise.get();

  // 一定相等 且只会执行一次异步任务
  console.log(first === twice === third); // true

  // 清空缓存
  cachePromise.clearCache();

  // 强制执行异步任务-刷新缓存
  cachePromise.forceUpdate();

  // 静态方法-清空指定cacheKey缓存
  CachePromise.clearCache(cachePromise.getCacheKey());

  // 静态方法-清空全部缓存
  CachePromise.clearCache();
  
}

main();

```
