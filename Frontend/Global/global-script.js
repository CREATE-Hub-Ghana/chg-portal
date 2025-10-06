// Navbar sticky/compact behavior: works on all pages that include a #navbar
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

// ----- Shared navigation & menu logic (moved here so all pages can import it) -----
(function sharedNavAndMenu() {
    // Desktop nav buttons mirror mobile menu behavior (scroll + selection)
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

        navBtns.forEach((btn) => {
            // determine logical role by textContent (robust to markup)
            const text = (btn.textContent || '').trim().toLowerCase();

            function activate() {
                clearDesktopSelection();
                clearMobileSelection();
                btn.classList.add('selected');
                const mobileHome = document.getElementById('home-m-btn');
                const mobileServices = document.getElementById('services-m-btn');
                const mobilePrograms = document.getElementById('programs-m-btn');

                // Close mobile overlay if open
                try {
                    menuOpen = false; // variable defined in menu block below
                    updateMenu();
                } catch (e) {
                    // ignore if not in scope
                }

                if (text === 'home') {
                    // If we're already on the home page, just scroll to top. Otherwise navigate to /home.
                    const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
                    if (currentPath === '/' || currentPath === '/home' || currentPath === '/home.html') {
                        if (mobileHome) mobileHome.classList.add('selected');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        window.location.pathname = '/home';
                    }
                } else if (text === 'programs') {
                    if (mobilePrograms) mobilePrograms.classList.add('selected');
                    // route to /programs
                    window.location.pathname = '/programs';
                } else if (text === 'services') {
                    if (mobileServices) mobileServices.classList.add('selected');
                    // compute target locally to avoid relying on outer-scope function
                    const servicesElement = document.querySelector('.second-sec');
                    if (servicesElement) {
                        const navbarEl = document.querySelector('#navbar');
                        const navHeight = navbarEl ? navbarEl.getBoundingClientRect().height : 0;
                        const target = Math.max(0, servicesElement.offsetTop - navHeight);
                        window.scrollTo({ top: target, behavior: 'smooth' });
                    } else {
                        // Not on the home page: navigate to home and include hash so home can scroll to services on load
                        window.location.href = '/home#services';
                    }
                }
            }

            btn.addEventListener('click', () => { activate(); });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate();
                }
            });
        });
    })();

    // Menu button + mobile menu behavior
    (function setupMenu() {
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
                        // If services section exists on this page, scroll to it. Otherwise navigate to home with hash so it scrolls on load.
                        const servicesElLocal = document.querySelector('.second-sec');
                        if (servicesElLocal) {
                            const target = computeServicesTarget();
                            window.scrollTo({ top: target, behavior: 'smooth' });
                        } else {
                            window.location.href = '/home#services';
                        }
                    }
                    if (btn.id === 'programs-m-btn') {
                        // route to programs page
                        window.location.pathname = '/programs';
                    }
                    if (btn.id === 'home-m-btn') {
                        // If already on home, scroll to top; otherwise route to /home
                        const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
                        if (currentPath === '/' || currentPath === '/home' || currentPath === '/home.html') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                            window.location.pathname = '/home';
                        }
                    }
                    menuOpen = false;
                    updateMenu();
                });

                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectButton(btn);
                        if (btn.id === 'services-m-btn') {
                            const servicesElLocal = document.querySelector('.second-sec');
                            if (servicesElLocal) {
                                const target = computeServicesTarget();
                                window.scrollTo({ top: target, behavior: 'smooth' });
                            } else {
                                window.location.href = '/home#services';
                            }
                        }
                        if (btn.id === 'programs-m-btn') {
                            window.location.pathname = '/programs';
                        }
                        if (btn.id === 'home-m-btn') {
                            const currentPath = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
                            if (currentPath === '/' || currentPath === '/home' || currentPath === '/home.html') {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                window.location.pathname = '/home';
                            }
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
            const programsBtn = document.getElementById('programs-m-btn');

            // also find desktop nav buttons to sync selection
            const desktopHome = Array.from(document.querySelectorAll('.nav-btn')).find(b => (b.textContent || '').trim().toLowerCase() === 'home');
            const desktopServices = Array.from(document.querySelectorAll('.nav-btn')).find(b => (b.textContent || '').trim().toLowerCase() === 'services');
            const desktopPrograms = Array.from(document.querySelectorAll('.nav-btn')).find(b => (b.textContent || '').trim().toLowerCase() === 'programs');

            // If this page doesn't have a services section (e.g. /programs), don't run the scroll-based fallback
            // Instead, initialize selection from the current pathname so the correct nav item stays selected.
            if (!servicesEl) {
                try {
                    const p = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
                    if (p === '/programs' || p === '/programs.html') {
                        if (homeBtn) homeBtn.classList.remove('selected');
                        if (servicesBtn) servicesBtn.classList.remove('selected');
                        if (programsBtn) programsBtn.classList.add('selected');

                        if (desktopHome) desktopHome.classList.remove('selected');
                        if (desktopServices) desktopServices && desktopServices.classList.remove('selected');
                        if (desktopPrograms) desktopPrograms.classList.add('selected');
                    } else if (p === '/home' || p === '/') {
                        if (homeBtn) homeBtn.classList.add('selected');
                        if (programsBtn) programsBtn.classList.remove('selected');

                        if (desktopHome) desktopHome.classList.add('selected');
                        if (desktopPrograms) desktopPrograms && desktopPrograms.classList.remove('selected');
                    }
                } catch (e) {
                    // ignore selection errors
                }

                // don't attach scroll observer/fallback since there's no services section
                return;
            }

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
            } else if (servicesEl && homeBtn && servicesBtn) {
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
})();

// If the page was opened with #services, scroll to the services section (useful after navigating from another page)
(function scrollToHashTargetsOnLoad() {
    if (!('location' in window)) return;
    try {
        if (window.location.hash === '#services') {
            // Wait a tick for layout and any deferred styles to apply
            setTimeout(() => {
                const servicesEl = document.querySelector('.second-sec');
                if (!servicesEl) return;
                const navbarEl = document.querySelector('#navbar');
                const navHeight = navbarEl ? navbarEl.getBoundingClientRect().height : 0;
                const target = Math.max(0, servicesEl.offsetTop - navHeight);
                window.scrollTo({ top: target, behavior: 'smooth' });
                // Remove the #services fragment from the URL after we've scrolled so subsequent reloads
                // won't re-trigger scrolling. Use replaceState to avoid adding history entries.
                try {
                    const url = window.location.href.replace(/#services$/, '');
                    history.replaceState(null, document.title, url);
                } catch (e) {
                    // ignore replaceState errors
                }
            }, 80);
        }
    } catch (e) {
        // ignore
    }
})();

