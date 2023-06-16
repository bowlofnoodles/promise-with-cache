'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * 生成uuid
 */
var uuidGenerate = function uuidGenerate() {
  var timestamp = new Date().getTime();
  var perforNow = typeof performance !== 'undefined' && performance.now && performance.now() * 1000 || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var random = Math.random() * 16;
    if (timestamp > 0) {
      random = (timestamp + random) % 16 | 0;
      timestamp = Math.floor(timestamp / 16);
    } else {
      random = (perforNow + random) % 16 | 0;
      perforNow = Math.floor(perforNow / 16);
    }
    return (c === 'x' ? random : random & 0x3 | 0x8).toString(16);
  });
};

// 存放等待状态的请求回调
var callbackMap = /*#__PURE__*/new Map();
// 异步任务状态缓存
var statusMap = /*#__PURE__*/new Map();
// 实际数据缓存
var cacheMap = /*#__PURE__*/new Map();
var CachePromise = /*#__PURE__*/function () {
  /**
   * 并发异步任务缓存
   *
   * @param promiseFunc 返回值是个promise的函数
   * @param cacheKey 缓存key，如果不指定静态cacheKey的话，那只能实例化一次（缓存key会在实例化生成）
   */
  function CachePromise(promiseFunc, cacheKey) {
    var _this = this;
    /**
     * 调用get方法，执行异步任务，缓存存在时会取缓存，如果有并发任务时，会等待上一个并发任务结束再取缓存
     */
    this.get = function () {
      if (!_this.cacheKey || typeof _this.promiseFunc !== 'function') {
        var paramsError = new Error('cacheKey or promiseFunc can not be empty');
        {
          console.error(paramsError);
        }
        return Promise.reject(paramsError);
      }
      if (statusMap.has(_this.cacheKey)) {
        var currentStatus = statusMap.get(_this.cacheKey);
        // 判断当前的接口缓存状态，如果是 complete ，则代表缓存完成
        if (currentStatus === 'complete') {
          return Promise.resolve(cacheMap.get(_this.cacheKey));
        }
        // 如果是 pending ，则代表正在请求中，这里放入回调函数
        if (currentStatus === 'pending') {
          return new Promise(function (resolve, reject) {
            if (callbackMap.has(_this.cacheKey)) {
              callbackMap.get(_this.cacheKey).push({
                onSuccess: resolve,
                onError: reject
              });
            } else {
              callbackMap.set(_this.cacheKey, [{
                onSuccess: resolve,
                onError: reject
              }]);
            }
          });
        }
      }
      statusMap.set(_this.cacheKey, 'pending');
      return _this.promiseFunc().then(function (res) {
        statusMap.set(_this.cacheKey, 'complete');
        cacheMap.set(_this.cacheKey, res);
        // 触发resolve的回调函数
        if (callbackMap.has(_this.cacheKey)) {
          callbackMap.get(_this.cacheKey).forEach(function (callback) {
            callback.onSuccess(res);
          });
          // 调用完成之后清掉，用不到了
          callbackMap["delete"](_this.cacheKey);
        }
        return res;
      }, function (error) {
        // 不成功的情况下删掉 statusMap 中的状态，能让下次请求重新请求
        statusMap["delete"](_this.cacheKey);
        // 这里触发reject的回调函数
        if (callbackMap.has(_this.cacheKey)) {
          callbackMap.get(_this.cacheKey).forEach(function (callback) {
            callback.onError(error);
          });
          // 调用完成之后也清掉
          callbackMap["delete"](_this.cacheKey);
        }
        // 返回 Promise.reject(error)，才能被catch捕捉到
        return Promise.reject(error);
      });
    };
    /**
     * 获取缓存key
     */
    this.getCacheKey = function () {
      return _this.cacheKey;
    };
    /**
     * 清空缓存
     */
    this.clearCache = function () {
      if (!_this.cacheKey) return;
      callbackMap["delete"](_this.cacheKey);
      statusMap["delete"](_this.cacheKey);
      cacheMap["delete"](_this.cacheKey);
    };
    /**
     * 手动强制执行异步任务-刷新缓存
     */
    this.forceUpdate = function () {
      _this.clearCache();
      return _this.get();
    };
    this.promiseFunc = promiseFunc;
    this.cacheKey = cacheKey != null ? cacheKey : this.generateCacheKey();
  }
  var _proto = CachePromise.prototype;
  _proto.generateCacheKey = function generateCacheKey() {
    return uuidGenerate();
  }
  /**
   * 静态方法-指定key清空缓存，如果不传则全部清空
   */;
  CachePromise.clearCache = function clearCache(cacheKey) {
    if (cacheKey == void 0) {
      callbackMap.clear();
      statusMap.clear();
      cacheMap.clear();
    } else {
      callbackMap["delete"](cacheKey);
      statusMap["delete"](cacheKey);
      cacheMap["delete"](cacheKey);
    }
  };
  return CachePromise;
}();

exports.default = CachePromise;
//# sourceMappingURL=promise-with-cache.cjs.development.js.map
