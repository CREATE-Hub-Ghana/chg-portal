const {
    redisSetWithRetry,
    redisGetWithRetry,
    redisDelWithRetry,
} = require("../config/redis-client");

// Function to invalidate cache
const invalidateCache = async (key) => {
    await redisDelWithRetry(key);
};

// Cache middleware
const cacheMiddleware = async (request, response, next) => {
    const userId =
        request.user && request.user.userId ? request.user.userId : "anonymous";
    const key = `__express__${request.originalUrl || request.url}:gctu-src:${userId}`;

    try {
        const cachedResponse = await redisGetWithRetry(key);
        if (cachedResponse) {
            return response.json(JSON.parse(cachedResponse));
        }
    } catch (error) {
        console.error("Redis error in cacheMiddleware:", error);
    }

    const sendResponse = response.json.bind(response);
    response.json = async (body) => {
        try {
            await redisSetWithRetry(key, JSON.stringify(body), { EX: 3600 });
        } catch (error) {
            console.error("Redis error while setting cache:", error);
        }
        sendResponse(body);
    };

    next();
};

module.exports = { cacheMiddleware, invalidateCache };
