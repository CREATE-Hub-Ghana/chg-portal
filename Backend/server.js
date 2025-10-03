require("dotenv").config({ path: "./Data.env" });

const cors = require("cors");
const express = require("express");
const compression = require("compression");

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

const { cacheMiddleware } = require("./middleware/cache.js");
const setupFileServing = require("./routes/static-serve.js");
const { redisClient } = require("./config/redis-client.js");

// Use gzip/deflate/brotli compression for responses where appropriate
app.use(compression({ threshold: 1024 }));

// Setup file serving (precompressed middleware is mounted inside routes)
setupFileServing(app, cacheMiddleware);

async function startServer() {
    try {
        const server = app.listen(port, () => {
            console.log(
                `Server running on port ${port} in ${process.env.NODE_ENV} mode`,
            );
        });

        // Handle graceful shutdown
        process.on("SIGINT", async () => {
            console.log("Shutting down server...");
            await redisClient.quit();
            server.close(() => {
                console.log("Server shut down gracefully.");
                process.exit(0);
            });
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}

startServer();

module.exports = app;