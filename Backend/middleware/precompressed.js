const fs = require('fs');
const path = require('path');

// Middleware that serves pre-compressed files (.br or .gz) when available
// For text-based assets only (js, css, svg, json, html) to reduce response size
module.exports = function precompressed(staticRoot) {
    return (req, res, next) => {
        try {
            const acceptEncoding = req.headers['accept-encoding'] || '';
            // Only handle GET/HEAD
            if (!['GET', 'HEAD'].includes(req.method)) return next();

            // Map request URL to filesystem path
            const reqPath = decodeURIComponent(req.path);
            const fullPath = path.join(staticRoot, reqPath);

            // Only consider known text types by extension
            const textExt = ['.js', '.css', '.svg', '.json', '.html', '.txt', '.map'];
            const ext = path.extname(fullPath).toLowerCase();
            if (!textExt.includes(ext)) return next();

            // Prefer Brotli then Gzip
            if (acceptEncoding.includes('br')) {
                const brPath = fullPath + '.br';
                if (fs.existsSync(brPath)) {
                    res.set('Content-Encoding', 'br');
                    res.set('Vary', 'Accept-Encoding');
                    // Set content-type based on extension
                    // Let express/static set content-type later when streaming from file
                    return res.sendFile(brPath, { dotfiles: 'ignore' }, (err) => {
                        if (err) return next();
                    });
                }
            }

            if (acceptEncoding.includes('gzip') || acceptEncoding.includes('deflate')) {
                const gzPath = fullPath + '.gz';
                if (fs.existsSync(gzPath)) {
                    res.set('Content-Encoding', 'gzip');
                    res.set('Vary', 'Accept-Encoding');
                    return res.sendFile(gzPath, { dotfiles: 'ignore' }, (err) => {
                        if (err) return next();
                    });
                }
            }

            return next();
        } catch (error) {
            // Don't break the request pipeline on middleware error
            console.error('precompressed middleware error:', error);
            return next();
        }
    };
};
