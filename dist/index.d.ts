declare class CachePromise<T = any> {
    private promiseFunc;
    private cacheKey;
    private generateCacheKey;
    /**
     * 静态方法-指定key清空缓存，如果不传则全部清空
     */
    static clearCache(cacheKey?: string): void;
    /**
     * 并发异步任务缓存
     *
     * @param promiseFunc 返回值是个promise的函数
     * @param cacheKey 缓存key，如果不指定静态cacheKey的话，那只能实例化一次（缓存key会在实例化生成）
     */
    constructor(promiseFunc: () => Promise<T>, cacheKey?: string);
    /**
     * 调用get方法，执行异步任务，缓存存在时会取缓存，如果有并发任务时，会等待上一个并发任务结束再取缓存
     */
    get: () => Promise<T>;
    /**
     * 获取缓存key
     */
    getCacheKey: () => string;
    /**
     * 清空缓存
     */
    clearCache: () => void;
    /**
     * 手动强制执行异步任务-刷新缓存
     */
    forceUpdate: () => Promise<T>;
}
export default CachePromise;
