// Navbar/menu behavior moved to Global/global-script.js

// Background image rotator for hero section
(() => {
    const hero = document.querySelector('.first-sec');
    if (!hero) return;

    // List of background images (relative paths from this JS file).
    // Populated from files under Frontend/Universal/Images
    const images = [
        "url('../../Universal/Images/group-pic-1.avif')",
        "url('../../Universal/Images/bs128.avif')",
        "url('../../Universal/Images/bs133.avif')",
        "url('../../Universal/Images/bs147.avif')",
        "url('../../Universal/Images/bs158.avif')",
        "url('../../Universal/Images/bs168.avif')",
        "url('../../Universal/Images/bs183.avif')",
        "url('../../Universal/Images/bs188.avif')",
        "url('../../Universal/Images/bs65.avif')",
        "url('../../Universal/Images/bs67.avif')"
    ];

    // Preload images to avoid flicker
    console.log('[hero rotator] preloading images...');
    images.forEach(src => {
        const img = new Image();
        // extract url(...) content
        const m = src.match(/url\(['"]?(.*?)['"]?\)/);
        if (m && m[1]) {
            img.src = m[1];
            // console.log('[hero rotator] preloaded:', m[1]);
        }
    });

    // Desktop nav buttons behavior moved to Global/global-script.js

    let idx = 0;
    const root = hero;

    // Which layer is currently visible: 'a' or 'b'
    let visible = 'a';

    // Utility to set layer background and opacity variables
    function setLayer(layer, imageUrl, opacity) {
        if (layer === 'a') {
            if (imageUrl != null) root.style.setProperty('--bg-a', imageUrl);
            root.style.setProperty('--bg-a-opacity', String(opacity));
        } else {
            if (imageUrl != null) root.style.setProperty('--bg-b', imageUrl);
            root.style.setProperty('--bg-b-opacity', String(opacity));
        }
    }

    // Initialize layers: A visible, B hidden
    // console.log('[hero rotator] initializing layers');
    setLayer('a', images[0], 0.42);
    setLayer('b', images[1] || images[0], 0);
    idx = 1; // next will be images[2]
    // console.log('[hero rotator] visible=a, next index=', idx, 'nextImage=', images[idx]);

    // Cross-fade to next image by placing it on the hidden layer and toggling opacities
    const TRANSITION_MS = 1000; // should match CSS transition duration
    let isTransitioning = false;
    let transitionTimeout = null;

    function crossFadeTo(nextImage) {
        if (isTransitioning) {
            // console.log('[hero rotator] crossFade skipped (in-progress)');
            return;
        }

        const hidden = visible === 'a' ? 'b' : 'a';

        // console.log('[hero rotator] crossFadeTo nextImage=', nextImage, 'hidden=', hidden, 'visible=', visible);

        isTransitioning = true;
        if (transitionTimeout) clearTimeout(transitionTimeout);

        // set hidden layer background and ensure it's fully hidden first
        setLayer(hidden, nextImage, 0);

        // force a reflow so the browser registers the new background before transition
        // eslint-disable-next-line no-unused-expressions
        root.offsetWidth;

        // start cross-fade: show hidden layer and hide visible layer in same frame
        requestAnimationFrame(() => {
            setLayer(hidden, nextImage, 0.42);
            setLayer(visible, null, 0);
        });

        // After transition duration, finalize swap
        transitionTimeout = setTimeout(() => {
            visible = hidden;
            isTransitioning = false;
            transitionTimeout = null;
            // console.log('[hero rotator] now visible=', visible);
        }, TRANSITION_MS + 80);
    }

    // Start interval (10 seconds)
    setInterval(() => {
        idx = (idx + 1) % images.length;
        // console.log('[hero rotator] tick, idx=', idx, 'image=', images[idx]);
        crossFadeTo(images[idx]);
    }, 10000);
})();

// Menu/menu-selection behavior moved to Global/global-script.js

// Organization logos infinite scroll for mobile
(() => {
    function initLogoScroll() {
        const strip = document.querySelector('.support-org-strip');
        if (!strip) return;

        // Only run on mobile screens
        const isMobile = () => window.innerWidth < 640;
        if (!isMobile()) return;

        // Grab original items (before cloning) and clone them for seamlessness
        const originalItems = Array.from(strip.children);
        // If already cloned (init ran before), avoid cloning again
        const alreadyCloned = originalItems.length > 0 && originalItems.some((n, i) => i >= originalItems.length / 2 && n.dataset.__cloned === 'true');
        if (!alreadyCloned) {
            const clones = originalItems.map(item => {
                const c = item.cloneNode(true);
                c.dataset.__cloned = 'true';
                return c;
            });
            clones.forEach(c => strip.appendChild(c));
        }

        let isPaused = false;
        const speed = 1.0; // pixels per frame

        // Pause interactions
        strip.addEventListener('mouseenter', () => isPaused = true, { passive: true });
        strip.addEventListener('mouseleave', () => isPaused = false, { passive: true });
        strip.addEventListener('touchstart', () => isPaused = true, { passive: true });
        strip.addEventListener('touchend', () => isPaused = false, { passive: true });

        // Variables to compute widths
        let totalOriginalWidth = 0; // width of one full set
        let scrollPos = 0;

        function recomputeWidths() {
            const items = Array.from(strip.querySelectorAll('.so-container'));
            // original count is half when already cloned
            const half = Math.floor(items.length / 2) || items.length;
            totalOriginalWidth = 0;
            for (let i = 0; i < half; i++) {
                totalOriginalWidth += items[i].getBoundingClientRect().width + parseFloat(getComputedStyle(items[i]).marginLeft || 0) + parseFloat(getComputedStyle(items[i]).marginRight || 0);
            }
            // ensure we have a non-zero width
            if (totalOriginalWidth === 0) totalOriginalWidth = strip.scrollWidth / 2 || strip.scrollWidth || 1;
        }

        // Force a recompute now
        recomputeWidths();

        // Recompute on resize with debounce
        let resizeTimeout = null;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (!isMobile()) {
                    strip.style.transform = '';
                    scrollPos = 0;
                    return;
                }
                recomputeWidths();
            }, 120);
        });

        // Continuous animation using modulo of totalOriginalWidth so there's no jump
        function animate() {
            if (!isPaused && isMobile()) {
                scrollPos = (scrollPos - speed) % totalOriginalWidth;
                // normalize to negative value for translateX
                const translate = scrollPos > 0 ? scrollPos - totalOriginalWidth : scrollPos;
                strip.style.transform = `translateX(${translate}px)`;
            }
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    // Run on load and page show
    window.addEventListener('load', initLogoScroll);
    window.addEventListener('pageshow', (e) => { if (e.persisted) initLogoScroll(); });
})();

// Counters: increment .gns-value elements from 0 to data-target on page load
(() => {
    function animateCounters() {
        const counters = document.querySelectorAll('.gns-value');
        if (!counters || counters.length === 0) return;

        counters.forEach(el => {
            // If already animated, skip
            if (el.dataset.animated === 'true') return;

            const target = parseInt(el.getAttribute('data-target') || '0', 10);
            const suffix = el.getAttribute('data-suffix') || '';

            // Set initial display to 0 plus suffix inside the bold tag if present, else directly
            const bold = el.querySelector('b');
            if (bold) bold.textContent = '0' + suffix;
            else el.textContent = '0' + suffix;

            if (target <= 0) {
                el.dataset.animated = 'true';
                return;
            }

            // Duration and step calculation: make it fast but smooth
            const duration = 900; // ms total for counting
            const fps = 60;
            const totalFrames = Math.round((duration / 850) * fps);
            const increment = Math.max(1, Math.floor(target / totalFrames));

            let current = 0;

            const tick = () => {
                current += increment;
                if (current >= target) current = target;

                if (bold) bold.textContent = current + suffix;
                else el.textContent = current + suffix;

                if (current < target) {
                    // schedule next frame
                    requestAnimationFrame(tick);
                } else {
                    el.dataset.animated = 'true';
                }
            };

            // Start the first frame
            requestAnimationFrame(tick);
        });
    }

    // Run on load (defer script already used) and also when coming back via bfcache/navigation
    window.addEventListener('load', animateCounters);
    window.addEventListener('pageshow', (e) => { if (e.persisted) animateCounters(); });
})();

// Image galleries: auto-rotate and manual controls for .fsbc-gallery
(function setupFsbcGalleries() {
    const GALLERY_INTERVAL_MS = 4000; // 4 seconds
    const TRANSITION_MS = 600; // crossfade duration (ms)
    const galleries = Array.from(document.querySelectorAll('.fsbc-gallery'));
    if (!galleries || galleries.length === 0) return;

    galleries.forEach(gallery => {
        const imgEl = gallery.querySelector('img');
        const nav = gallery.querySelector('.nav-fsbc-gallery');
        if (!imgEl || !nav) return;

        // Build image list from nav buttons' data-src attributes
        const buttons = Array.from(nav.querySelectorAll('button'));
        const imgs = buttons.map(b => b.getAttribute('data-src')).filter(Boolean);
        if (imgs.length === 0) return;

        // Prepare a crossfade layer: use two stacked img elements (a and b)
        // Ensure gallery is position-relative so absolute imgs overlap
        const computedPos = window.getComputedStyle(gallery).position;
        if (computedPos === 'static') gallery.style.position = 'relative';
        gallery.style.overflow = 'hidden';

        // Use the existing imgEl as imgA and create imgB
        const imgA = imgEl;
        const imgB = imgA.cloneNode(true);
        // ensure both occupy full area and overlap
        [imgA, imgB].forEach(img => {
            img.style.position = 'absolute';
            img.style.top = '0';
            img.style.left = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectPosition = 'center';
            img.style.objectFit = img.style.objectFit || 'inherit';
            // include transform transition so hover scaling is smooth
            img.style.transition = `opacity ${TRANSITION_MS}ms ease, transform 420ms ease`;
            img.style.willChange = 'opacity, transform';
            img.style.transform = 'scale(1)';
            // leave pointer events on images disabled so interactive controls beneath still work;
            // hover/scale is applied via gallery listeners so pointerEvents none is acceptable
            img.style.pointerEvents = 'none';
        });

        // Insert imgB on top of imgA (so we can fade it in)
        imgA.style.zIndex = '0';
        imgB.style.zIndex = '1';
        imgB.style.opacity = '0';
        if (imgA.nextSibling) gallery.insertBefore(imgB, imgA.nextSibling);
        else gallery.appendChild(imgB);

        // Find initial index matching current img src, fallback to 0
        let current = imgs.findIndex(s => s === (imgA.getAttribute('src') || ''));
        if (current < 0) {
            current = 0;
            imgA.setAttribute('src', imgs[0]);
        }

        // track which layer currently visible: 0 => imgA, 1 => imgB
        let visibleLayer = 0;

        function updateNav() {
            buttons.forEach((b, i) => {
                if (i === current) b.classList.add('in-view');
                else b.classList.remove('in-view');
            });
        }

        updateNav();

        let timer = null;
        let isPaused = false;

        // crossfade to specified index
        function showIndex(idx, { resetTimer = true } = {}) {
            if (idx < 0) idx = imgs.length - 1;
            if (idx >= imgs.length) idx = 0;
            if (idx === current) {
                if (resetTimer) restartTimer();
                return;
            }

            current = idx;
            updateNav();

            const visibleImg = visibleLayer === 0 ? imgA : imgB;
            const hiddenImg = visibleLayer === 0 ? imgB : imgA;

            // place next image on hidden layer
            hiddenImg.setAttribute('src', imgs[current]);
            hiddenImg.style.opacity = '0';

            // force reflow so browser registers src change before transition
            // eslint-disable-next-line no-unused-expressions
            hiddenImg.offsetWidth;

            // start crossfade: fade hidden in, visible out
            hiddenImg.style.opacity = '1';
            visibleImg.style.opacity = '0';

            // after transition completes, swap visibleLayer
            setTimeout(() => {
                visibleLayer = visibleLayer === 0 ? 1 : 0;
                if (resetTimer) restartTimer();
            }, TRANSITION_MS + 40);
        }

        function next() { showIndex((current + 1) % imgs.length); }
        function prev() { showIndex((current - 1 + imgs.length) % imgs.length); }

        function restartTimer() {
            if (timer) clearInterval(timer);
            timer = setInterval(() => { if (!isPaused) next(); }, GALLERY_INTERVAL_MS);
        }

        // click handlers for nav buttons
        buttons.forEach((btn, i) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showIndex(i, { resetTimer: true });
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    showIndex(i, { resetTimer: true });
                }
            });
        });

        // Pause on hover/touch so user can interact and scale images slightly on hover
        gallery.addEventListener('mouseenter', () => {
            isPaused = true;
            imgA.style.transform = 'scale(1.04)';
            imgB.style.transform = 'scale(1.04)';
        }, { passive: true });
        gallery.addEventListener('mouseleave', () => {
            isPaused = false;
            imgA.style.transform = 'scale(1)';
            imgB.style.transform = 'scale(1)';
        }, { passive: true });
        gallery.addEventListener('touchstart', () => {
            isPaused = true;
            imgA.style.transform = 'scale(1.04)';
            imgB.style.transform = 'scale(1.04)';
        }, { passive: true });
        gallery.addEventListener('touchend', () => {
            isPaused = false;
            imgA.style.transform = 'scale(1)';
            imgB.style.transform = 'scale(1)';
        }, { passive: true });

        // Start rotation
        restartTimer();
    });
})();


