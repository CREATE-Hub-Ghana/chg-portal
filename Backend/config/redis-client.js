const Redis = require("ioredis");

if (!process.env.REDIS_URL) {
  console.error("🚨 REDIS_URL is not set in environment variables.");
  process.exit(1);
}

// Create Redis client with enhanced configuration
const redisClient = new Redis(process.env.REDIS_URL, {
  // Connection and retry settings
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3, // Built-in retry for all operations
  reconnectOnError: (error) => {
    // Reconnect on these errors
    const targetErrors = [/READONLY/, /ETIMEDOUT/];
    return targetErrors.some((pattern) => pattern.test(error.message));
  },
  enableOfflineQueue: true, // Queue commands when disconnected
});

const redisSetWithRetry = async (key, value, options = {}, maxRetries = 3) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const arguments_ = [];
      if (options.EX) arguments_.push("EX", options.EX);
      if (options.NX) arguments_.push("NX");
      if (options.XX) arguments_.push("XX");

      return await redisClient.set(key, value, ...arguments_);
    } catch (error) {
      retries++;
      console.warn(
        `Redis SET failed, retry ${retries}/${maxRetries}:`,
        error.message,
      );
      if (retries >= maxRetries) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, 100 * Math.pow(2, retries)),
      ); // Exponential backoff
    }
  }
};

const redisGetWithRetry = async (key) => redisClient.get(key);

const redisDelWithRetry = async (key) => redisClient.del(key);

// Enhanced event handlers
redisClient.on("error", (error) => {
  console.error("❌ Redis connection error:", error);
});

redisClient.on("connect", () => {
  console.log("✅ Server connected to Redis");
});

redisClient.on("end", () => {
  console.log("⚠️ Server disconnected from Redis");
});

redisClient.on("reconnecting", (delay) => {
  console.log(`🔄 Server attempting to reconnect to Redis in ${delay}ms...`);
});

// Graceful shutdown
const shutdownRedis = async () => {
  try {
    await redisClient.quit();
    console.log("Redis connection closed through app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error closing Redis connection:", error);
    process.exit(1);
  }
};

process.on("SIGINT", shutdownRedis);
process.on("SIGTERM", shutdownRedis);

// Add pipeline support for batch operations
const redisPipeline = redisClient.pipeline.bind(redisClient);

module.exports = {
  redisClient,
  redisSetWithRetry,
  redisGetWithRetry,
  redisDelWithRetry,
  redisPipeline, // Bonus: add pipeline support
};
