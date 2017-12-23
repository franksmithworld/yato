import BucketList, {BucketCategory} from './BucketList'

const TIMEOUT_INDICATOR = 'request timeout'

export type Command = (...args: any[]) => Promise<any>
export function executeCommand (command: Command, bucketList: BucketList, timeoutDuration: number): any {
  const increment = (category: BucketCategory, runTime: number) => {
    bucketList.increaseBucketValue(category)
    bucketList.collectRuntime(runTime)
  }

  const startTime = Date.now()
  const getRunTime = () => Date.now() - startTime

  const commandPromise = command()
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(resolve, timeoutDuration, TIMEOUT_INDICATOR)
  })

  // command 和 timeout 竞争
  return Promise.race([commandPromise, timeoutPromise]).then((data) => {
    if (data === TIMEOUT_INDICATOR) {
      // 记录超时情况，成功或者失败的情况在超时时间之内返回，则不记录超时
      increment(BucketCategory.Timeouts, getRunTime())
      throw new Error('Timeout')
    }
    // 记录成功
    increment(BucketCategory.Successes, getRunTime())
    return data
  }, (error) => {
    // 记录失败
    increment(BucketCategory.Failures, getRunTime())
    throw error
  })
}