// Swap social icon images to their *_white.svg variant on hover/focus
// and revert back on mouseleave/blur. Falls back to the original image
// if the white variant fails to load.
document.addEventListener('DOMContentLoaded', () => {
    const socialLinks = document.querySelectorAll('.social-c');

    socialLinks.forEach((link) => {
        const img = link.querySelector('img');
        if (!img) return;

        // store original src so we can revert
        const originalSrc = img.getAttribute('src') || '';
        link.dataset.origSrc = originalSrc;

        // Build the white-variant src from the current src
        const makeWhiteSrc = (src) => {
            // Prefer replacing the explicit pattern "_black.svg" -> "_white.svg"
            if (src.includes('_black.svg')) return src.replace('_black.svg', '_white.svg');

            // Fall back to replacing any trailing "black.svg" -> "white.svg"
            if (src.includes('black.svg')) return src.replace('black.svg', 'white.svg');

            // As a last resort, insert "_white" before the .svg extension
            return src.replace(/\.svg$/i, '_white.svg');
        };

        const setToWhite = () => {
            const currentSrc = img.getAttribute('src') || '';
            const whiteSrc = makeWhiteSrc(currentSrc || link.dataset.origSrc || '');

            // If it would be the same as current, nothing to do
            if (!whiteSrc || whiteSrc === currentSrc) return;

            // If the white variant fails to load, revert to original once
            const onError = () => {
                img.removeEventListener('error', onError);
                if (link.dataset.origSrc) img.setAttribute('src', link.dataset.origSrc);
            };

            img.addEventListener('error', onError, { once: true });
            img.setAttribute('src', whiteSrc);
        };

        const revertToOriginal = () => {
            const orig = link.dataset.origSrc;
            if (orig) img.setAttribute('src', orig);
        };

        // Mouse and keyboard interactions
        link.addEventListener('mouseenter', setToWhite);
        link.addEventListener('mouseleave', revertToOriginal);
        link.addEventListener('focus', setToWhite, true);
        link.addEventListener('blur', revertToOriginal, true);
    });
});

