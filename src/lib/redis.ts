import IORedis from "ioredis"

const REDIS_URL = process.env.REDIS_URL || ""

let redis: IORedis | null = null

if (REDIS_URL) {
  redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 2,
    retryStrategy(times) {
      if (times > 3) return null
      return Math.min(times * 200, 2000)
    },
    lazyConnect: true,
  })
  redis.on("error", () => {})
}

export async function getCached<T>(key: string, ttl = 60): Promise<T | null> {
  if (!redis) return null
  try {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

export async function setCache(key: string, data: unknown, ttl = 60): Promise<void> {
  if (!redis) return
  try {
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch {}
}

export async function clearCache(pattern: string): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch {}
}

export { redis }
