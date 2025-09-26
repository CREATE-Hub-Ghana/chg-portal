window.addEventListener("scroll", function () {
    const navbar = document.querySelector("#navbar");
    if (!navbar) return;
    if (window.scrollY > 25) {
        navbar.style.backdropFilter = "blur(4px)";
        navbar.style.webkitBackdropFilter = "blur(4px)";
        navbar.style.top = "2.5%";
        navbar.style.width = "97%";
        navbar.style.borderRadius = "25px";
        navbar.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    } else {
        navbar.style.backdropFilter = "";
        navbar.style.webkitBackdropFilter = "";
        navbar.style.top = "";
        navbar.style.width = "";
        navbar.style.borderRadius = "";
        navbar.style.backgroundColor = "";
    }
});

// Background image rotator for hero section
(() => {
    const hero = document.querySelector('.first-sec');
    if (!hero) return;

    // List of background images (relative paths from this JS file).
    // Populated from files under Frontend/Universal/Images
    const images = [
        "url('../../Universal/Images/group-pic-1.jpg')",
        "url('../../Universal/Images/bs128.jpg')",
        "url('../../Universal/Images/bs133.jpg')",
        "url('../../Universal/Images/bs147.jpg')",
        "url('../../Universal/Images/bs158.jpg')",
        "url('../../Universal/Images/bs168.jpg')",
        "url('../../Universal/Images/bs183.jpg')",
        "url('../../Universal/Images/bs188.jpg')",
        "url('../../Universal/Images/bs65.jpg')",
        "url('../../Universal/Images/bs67.jpg')"
    ];

    // Preload images to avoid flicker
    console.log('[hero rotator] preloading images...');
    images.forEach(src => {
        const img = new Image();
        // extract url(...) content
        const m = src.match(/url\(['"]?(.*?)['"]?\)/);
        if (m && m[1]) {
            img.src = m[1];
            console.log('[hero rotator] preloaded:', m[1]);
        }
    });

    // Desktop nav buttons: mirror behavior of mobile menu (scroll + update selection)
    (function setupDesktopNavButtons() {
        const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
        if (!navBtns || navBtns.length === 0) return;

        function clearDesktopSelection() {
            navBtns.forEach(b => b.classList.remove('selected'));
        }

        function clearMobileSelection() {
            const mobileBtns = document.querySelectorAll('.m-btn');
            mobileBtns.forEach(b => b.classList.remove('selected'));
        }

        const servicesEl = document.querySelector('.second-sec');

        navBtns.forEach((btn, idx) => {
            // determine logical role by textContent (robust to markup)
            const text = (btn.textContent || '').trim().toLowerCase();

            function activate() {
                clearDesktopSelection();
                clearMobileSelection();
                btn.classList.add('selected');
                const mobileHome = document.getElementById('home-m-btn');
                const mobileServices = document.getElementById('services-m-btn');

                // Close mobile overlay if open
                try {
                    menuOpen = false; // parent scope variable
                    updateMenu();
                } catch (e) {
                    // ignore if not in scope
                }

                if (text === 'home') {
                    if (mobileHome) mobileHome.classList.add('selected');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (text === 'services') {
                    if (mobileServices) mobileServices.classList.add('selected');
                    // compute target locally to avoid relying on outer-scope function
                    const servicesElement = document.querySelector('.second-sec');
                    const navbarEl = document.querySelector('#navbar');
                    const navHeight = navbarEl ? navbarEl.getBoundingClientRect().height : 0;
                    const target = servicesElement ? Math.max(0, servicesElement.offsetTop - navHeight) : window.innerHeight;
                    window.scrollTo({ top: target, behavior: 'smooth' });
                }
            }

            btn.addEventListener('click', (e) => {
                activate();
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate();
                }
            });
        });
    })();

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
    console.log('[hero rotator] initializing layers');
    setLayer('a', images[0], 0.42);
    setLayer('b', images[1] || images[0], 0);
    idx = 1; // next will be images[2]
    console.log('[hero rotator] visible=a, next index=', idx, 'nextImage=', images[idx]);

    // Cross-fade to next image by placing it on the hidden layer and toggling opacities
    const TRANSITION_MS = 1000; // should match CSS transition duration
    let isTransitioning = false;
    let transitionTimeout = null;

    function crossFadeTo(nextImage) {
        if (isTransitioning) {
            console.log('[hero rotator] crossFade skipped (in-progress)');
            return;
        }

        const hidden = visible === 'a' ? 'b' : 'a';

        console.log('[hero rotator] crossFadeTo nextImage=', nextImage, 'hidden=', hidden, 'visible=', visible);

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
            console.log('[hero rotator] now visible=', visible);
        }, TRANSITION_MS + 80);
    }

    // Start interval (10 seconds)
    setInterval(() => {
        idx = (idx + 1) % images.length;
        console.log('[hero rotator] tick, idx=', idx, 'image=', images[idx]);
        crossFadeTo(images[idx]);
    }, 10000);
})();

// Menu button: track open/closed state and swap icon src
(() => {
    const menuBtn = document.querySelector('.menu-btn');
    const menuContainer = document.querySelector('.menu-container');
    const mBtnContainer = document.querySelector('.m-btn-container');
    if (!menuBtn) return;

    const img = menuBtn.querySelector('img');
    // initial state
    let menuOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');

    const MENU_ICON = "../../Universal/Icons/menu_black.svg";
    const CLOSE_ICON = "../../Universal/Icons/close_black.svg";

    function updateMenu() {
        menuBtn.setAttribute('aria-expanded', String(menuOpen));
        if (menuOpen) {
            document.body.classList.add('menu-open');
            if (img) img.src = CLOSE_ICON;
            menuBtn.style.backgroundColor = 'rgba(59, 131, 246, 0.25)';
            if (menuContainer) menuContainer.classList.add('shown');
            if (mBtnContainer) mBtnContainer.classList.add('shown');
        } else {
            document.body.classList.remove('menu-open');
            if (img) img.src = MENU_ICON;
            menuBtn.style.backgroundColor = '';
            if (menuContainer) menuContainer.classList.remove('shown');
            if (mBtnContainer) mBtnContainer.classList.remove('shown');
        }
    }

    // Compute scroll target for the services section so it sits fully under the navbar
    function computeServicesTarget() {
        const servicesEl = document.querySelector('.second-sec');
        if (!servicesEl) return window.innerHeight;
        const navbarEl = document.querySelector('#navbar');
        const navHeight = navbarEl ? navbarEl.getBoundingClientRect().height : 0;
        // offsetTop is distance from document top; subtract navbar height so the section appears below it
        return Math.max(0, servicesEl.offsetTop - navHeight);
    }

    menuBtn.addEventListener('click', () => {
        menuOpen = !menuOpen;
        updateMenu();
        console.log('[menu] toggled, open=', menuOpen);
    });

    // support keyboard activation (Enter / Space)
    menuBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            menuOpen = !menuOpen;
            updateMenu();
        }
    });

    // Close menu when clicking/tapping outside of it (or pressing Escape)
    document.addEventListener('pointerdown', (e) => {
        if (!menuOpen) return;
        const target = e.target;
        // if click is inside menu button or container, do nothing
        if (menuBtn.contains(target)) return;
        if (menuContainer && menuContainer.contains(target)) return;
        // otherwise close
        menuOpen = false;
        updateMenu();
        console.log('[menu] closed by outside click');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) {
            menuOpen = false;
            updateMenu();
            console.log('[menu] closed by Escape');
        }
    });

    // Mobile menu item selection: toggle .selected on .m-btn
    (function setupMobileMenuSelection() {
        if (!mBtnContainer) return;
        const mBtns = Array.from(mBtnContainer.querySelectorAll('.m-btn'));
        if (!mBtns || mBtns.length === 0) return;

        function selectButton(btn) {
            mBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        }

        mBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectButton(btn);
                // optional: close menu when an item is chosen
                // Close menu when an item is chosen and scroll for specific IDs
                if (btn.id === 'services-m-btn') {
                    // scroll so the services section sits below the navbar
                    const target = computeServicesTarget();
                    window.scrollTo({ top: target, behavior: 'smooth' });
                }
                if (btn.id === 'home-m-btn') {
                    // scroll to top smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                menuOpen = false;
                updateMenu();
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectButton(btn);
                    if (btn.id === 'services-m-btn') {
                        const target = computeServicesTarget();
                        window.scrollTo({ top: target, behavior: 'smooth' });
                    }
                    if (btn.id === 'home-m-btn') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    menuOpen = false;
                    updateMenu();
                }
            });
        });

        // Highlight Home or Services in the mobile menu using IntersectionObserver for smoother thresholding
        const servicesEl = document.querySelector('.second-sec');
        const homeBtn = document.getElementById('home-m-btn');
        const servicesBtn = document.getElementById('services-m-btn');

        // also find desktop nav buttons to sync selection
        const desktopHome = Array.from(document.querySelectorAll('.nav-btn')).find(b => (b.textContent || '').trim().toLowerCase() === 'home');
        const desktopServices = Array.from(document.querySelectorAll('.nav-btn')).find(b => (b.textContent || '').trim().toLowerCase() === 'services');

        if (servicesEl && homeBtn && servicesBtn && 'IntersectionObserver' in window) {
            // When services section is at least 40% visible, mark Services selected
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        // mobile
                        homeBtn.classList.remove('selected');
                        servicesBtn.classList.add('selected');
                        // desktop
                        if (desktopHome) desktopHome.classList.remove('selected');
                        if (desktopServices) desktopServices.classList.add('selected');
                    } else if (entry.intersectionRatio < 0.5) {
                        servicesBtn.classList.remove('selected');
                        homeBtn.classList.add('selected');
                        if (desktopServices) desktopServices.classList.remove('selected');
                        if (desktopHome) desktopHome.classList.add('selected');
                    }
                });
            }, { threshold: [0, 0.25, 0.4, 0.5, 0.75, 1] });

            observer.observe(servicesEl);
        } else if (homeBtn && servicesBtn) {
            // Fallback: simple threshold based on scrollY
            function fallbackUpdate() {
                const scrollY = window.scrollY || window.pageYOffset;
                const threshold = servicesEl ? (servicesEl.getBoundingClientRect().top + window.scrollY) - 50 : window.innerHeight / 2;
                if (scrollY >= threshold) {
                    homeBtn.classList.remove('selected');
                    servicesBtn.classList.add('selected');
                    if (desktopHome) desktopHome.classList.remove('selected');
                    if (desktopServices) desktopServices.classList.add('selected');
                } else {
                    servicesBtn.classList.remove('selected');
                    homeBtn.classList.add('selected');
                    if (desktopServices) desktopServices.classList.remove('selected');
                    if (desktopHome) desktopHome.classList.add('selected');
                }
            }

            fallbackUpdate();
            window.addEventListener('scroll', () => { fallbackUpdate(); });
        }
    })();
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
