const path = require("path");

const express = require("express");

const precompressed = require("../middleware/precompressed");

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
                    // Default to 1 day for unknown assets
                    response.set("Cache-Control", "public, max-age=86400, immutable");
                }
            },
        }),
    );

    // Serve Global assets; use precompressed middleware for text assets
    app.use(
        "/Global",
        precompressed(path.join(__dirname, "..", "..", "Frontend", "Global")),
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

    // Use precompressed and cache middleware for the Universal directory assets
    // Also set long cache lifetimes for images/fonts/icons to 30 days
    const universalRoot = path.join(__dirname, "..", "..", "Frontend", "Universal");
    app.use(
        "/Universal",
        precompressed(universalRoot),
        cacheMiddleware,
        express.static(universalRoot, {
            dotfiles: "ignore",
            etag: true,
            index: false,
            maxAge: "30d",
            redirect: false,
            setHeaders: (response, filePath) => {
                response.set("X-Content-Type-Options", "nosniff");

                // HTML should not be cached
                if (filePath.endsWith(".html")) {
                    response.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
                    response.set("Expires", "0");
                    return;
                }

                // Images, fonts, icons -> 30 days immutable
                const imgFontExt = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
                const ext = path.extname(filePath).toLowerCase();
                if (imgFontExt.includes(ext)) {
                    response.set('Cache-Control', 'public, max-age=2592000, immutable'); // 30 days
                } else {
                    response.set('Cache-Control', 'public, max-age=86400, immutable');
                }
            },
        }),
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

    // Serve programs.html for the /programs route
    app.get("/programs", (request, response) => {
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "Frontend",
            "Portal",
            "Programs",
            "programs.html",
        );
        response.sendFile(filePath);
    });

    // Serve programs.html for the /programs route
    app.get("/contact", (request, response) => {
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "Frontend",
            "Portal",
            "Contact",
            "contact.html",
        );
        response.sendFile(filePath);
    });

    // Serve about.html for the /about route
    app.get("/about", (request, response) => {
        const filePath = path.join(
            __dirname,
            "..",
            "..",
            "Frontend",
            "Portal",
            "About",
            "about.html",
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
