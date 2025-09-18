const path = require("path");

const express = require("express");

const setupFileServing = (app, cacheMiddleware) => {
    // Block access to sensitive files
    app.use((request, response, next) => {
        if (request.url.match(/\.(git|env|log|config)$/i)) {
            return response.status(403).send("Access denied");
        }
        next();
    });

    // Root redirect
    app.get("/", (request, response) => {
        response.redirect("/home");
    });

    // Static file serving with security headers
    app.use(
        express.static(path.join(__dirname, "..", "..", "Frontend"), {
            dotfiles: "ignore",
            etag: true,
            index: false,
            maxAge: "1d",
            redirect: false,
            setHeaders: (response, filePath) => {
                response.set("X-Content-Type-Options", "nosniff");

                if (filePath.endsWith(".html")) {
                    response.set(
                        "Cache-Control",
                        "no-store, no-cache, must-revalidate, proxy-revalidate",
                    );
                    response.set("Expires", "0");
                } else {
                    response.set("Cache-Control", "public, max-age=86400, immutable");
                }
            },
        }),
    );

    app.use(
        "/Global",
        express.static(path.join(__dirname, "..", "..", "Frontend", "Global"), {
            dotfiles: "ignore",
            etag: true,
            index: false,
            maxAge: "1d",
            redirect: false,
            setHeaders: (response, filePath) => {
                response.set("X-Content-Type-Options", "nosniff");

                if (filePath.endsWith(".html")) {
                    response.set("Cache-Control", "no-cache");
                }
            },
        }),
    );

    // Use the cache middleware for the Universal directory assets
    app.use(
        "/Universal",
        cacheMiddleware,
        express.static(path.join(__dirname, "..", "..", "Frontend", "Universal")),
    );

    // Serve home.html for the /home route
    app.get("/home", (request, response) => {
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "Frontend",
            "Portal",
            "Home",
            "home.html",
        );
        response.sendFile(filePath);
    });

    // Error handling middleware
    app.use((error, request, response, next) => {
        if (error instanceof Error && error.code === "ENOENT") {
            return response.status(404).send("Not Found");
        }
        next(error);
    });
};

module.exports = setupFileServing;
