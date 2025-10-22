document.addEventListener('DOMContentLoaded', () => {
    // Collect filter buttons and story nodes
    const filterButtons = Array.from(document.querySelectorAll('.lu-filter'));
    const storyBlocks = Array.from(document.querySelectorAll('.story-block'));
    const secondSec = document.querySelector('.second-sec');
    const featured = document.querySelector('.featured-story-container');
    const searchButton = document.getElementById('filter-search-btn');
    const searchInput = document.getElementById('filter-search');

    // Helper: extract category text from a story-block
    function getCategory(el) {
        const cat = el.querySelector('.sb-category');
        return cat ? cat.textContent.trim() : '';
    }

    // Helper: find a calendar sd-block span text inside a container
    function extractDateText(container) {
        if (!container) return null;
        // find any .sd-block that contains an img with alt containing 'Calendar'
        const sdBlocks = container.querySelectorAll('.sd-block');
        for (const sd of sdBlocks) {
            const img = sd.querySelector('img');
            const span = sd.querySelector('span');
            if (img && /calendar/i.test(img.alt || '') && span) {
                return span.textContent.trim();
            }
        }
        // Fallback: any span that looks like a date (contains 4-digit year)
        const spans = container.querySelectorAll('span');
        for (const s of spans) {
            if (/\b\d{4}\b/.test(s.textContent)) return s.textContent.trim();
        }
        return null;
    }

    // Parse a human-readable date string to a Date object; return null if invalid
    function parseDate(dateStr) {
        if (!dateStr) return null;
        // Try native parsing first
        const d = new Date(dateStr);
        if (!isNaN(d)) return d;

        // Try common fallback formats (e.g., 'October 21, 2024') - native should handle it
        // If still invalid, try to massage common unicode spaces
        const cleaned = dateStr.replace(/[\u00A0\u202F]/g, ' ').trim();
        const d2 = new Date(cleaned);
        return isNaN(d2) ? null : d2;
    }

    // Build dataset for each story element (date, category, popularity fallback)
    // Only include story blocks inside .third-sec (do not include featured .second-sec)
    const allStoryNodes = storyBlocks.slice();

    allStoryNodes.forEach((node, idx) => {
        // category
        const cat = getCategory(node) || '';
        node.dataset.category = cat.toLowerCase();

        // date
        const dateText = extractDateText(node);
        const parsed = parseDate(dateText);
        node.dataset.dateIso = parsed ? parsed.toISOString() : '';

        // popularity: allow authors to set data-popularity in HTML; otherwise fall back to DOM order
        if (!node.dataset.popularity) node.dataset.popularity = String(allStoryNodes.length - idx);
    });

    // Utility: show/hide node
    function showNode(node) {
        node.style.display = '';
        node.setAttribute('aria-hidden', 'false');
    }

    function hideNode(node) {
        node.style.display = 'none';
        node.setAttribute('aria-hidden', 'true');
    }

    // Helper to set which filter button is visually active
    function setActiveFilterButton(btnOrId) {
        filterButtons.forEach(b => b.classList.remove('active-filter'));
        if (!btnOrId) return;
        const btn = typeof btnOrId === 'string' ? document.getElementById(btnOrId) : btnOrId;
        if (btn && btn.classList) btn.classList.add('active-filter');
    }

    // Apply a filter: type can be 'all' | 'category' | 'latest' | 'popular' | 'search'
    function applyFilter(type, value) {
        // NOTE: active button is managed separately via setActiveFilterButton

        if (type === 'all') {
            allStoryNodes.forEach(showNode);
            return;
        }

        if (type === 'search') {
            const query = (value || '').toLowerCase().trim();
            if (!query) {
                // empty search -> show all and display featured story
                allStoryNodes.forEach(showNode);
                if (featured) featured.style.display = '';
                if (secondSec) secondSec.style.paddingBottom = '';
                return;
            }
            // hide featured story when search is active
            if (featured) featured.style.display = 'none';
            if (secondSec) secondSec.style.paddingBottom = '30px';

            allStoryNodes.forEach(node => {
                // get story title and category text
                const titleEl = node.querySelector('.story-title span');
                const categoryEl = node.querySelector('.sb-category');
                const title = titleEl ? titleEl.textContent.toLowerCase() : '';
                const category = categoryEl ? categoryEl.textContent.toLowerCase() : '';

                // match against title or category
                if (title.includes(query) || category.includes(query)) {
                    showNode(node);
                } else {
                    hideNode(node);
                }
            });
            return;
        }

        if (type === 'category') {
            const wanted = (value || '').toLowerCase();
            allStoryNodes.forEach(node => {
                // featured story doesn't have a category; hide it for category-specific filters
                if (!node.dataset.category) return hideNode(node);
                if (node.dataset.category === wanted) showNode(node);
                else hideNode(node);
            });
            return;
        }

        if (type === 'latest') {
            // Find newest date among nodes
            const dates = allStoryNodes.map(n => n.dataset.dateIso).filter(Boolean).map(s => new Date(s));
            if (dates.length === 0) {
                // no dates -> show all
                allStoryNodes.forEach(showNode);
                return;
            }
            const newest = new Date(Math.max(...dates.map(d => d.getTime())));
            const cutoff = new Date(newest.getTime() - 30 * 24 * 60 * 60 * 1000);
            allStoryNodes.forEach(node => {
                const iso = node.dataset.dateIso;
                if (!iso) return hideNode(node);
                const nd = new Date(iso);
                if (nd >= cutoff) showNode(node); else hideNode(node);
            });
            return;
        }

        if (type === 'popular') {
            // show top 3 by data-popularity (number descending), fallback to first 3 DOM order
            const ranked = allStoryNodes.slice().sort((a, b) => Number(b.dataset.popularity || 0) - Number(a.dataset.popularity || 0));
            const top = new Set(ranked.slice(0, 3));
            allStoryNodes.forEach(node => top.has(node) ? showNode(node) : hideNode(node));
            return;
        }
    }

    // Wire filter button clicks
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.id || '';
            // set active class
            setActiveFilterButton(btn);

            switch (id) {
                case 'filter-all':
                    applyFilter('all');
                    break;
                case 'filter-latest':
                    applyFilter('latest');
                    break;
                case 'filter-popular':
                    applyFilter('popular');
                    break;
                case 'filter-programs':
                case 'filter-tech':
                case 'filter-education':
                case 'filter-success':
                    // map id to human category label
                    const labelMap = {
                        'filter-programs': 'Programs',
                        'filter-tech': 'Technology',
                        'filter-education': 'Education',
                        'filter-success': 'Success stories'
                    };
                    applyFilter('category', labelMap[id]);
                    break;
                default:
                    applyFilter('all');
            }
        });

        // keyboard accessibility
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Wire mobile menu buttons (if present) to trigger the same filters
    const mobileButtons = Array.from(document.querySelectorAll('.m-btn'));
    mobileButtons.forEach(mb => {
        mb.addEventListener('click', () => {
            const txt = (mb.textContent || '').trim().toLowerCase();
            // remove 's' differences e.g., 'Programs' -> 'programs'
            if (txt === 'blog' || txt === 'home' || txt === 'about' || txt === 'contact' || txt === 'services') {
                // these don't filter blog stories; show all
                setActiveFilterButton('filter-all');
                applyFilter('all');
                return;
            }
            if (txt === 'programs') return applyFilter('category', 'Programs');
            if (txt === 'programmes' || txt === 'program') return applyFilter('category', 'Programs');
            if (txt === 'technology' || txt === 'tech') return applyFilter('category', 'Technology');
            if (txt === 'education') return applyFilter('category', 'Education');
            if (txt.includes('success')) return applyFilter('category', 'Success stories');
            // fallback
            setActiveFilterButton('filter-all');
            applyFilter('all');
        });
    });

    // Initialize: show all
    // Make sure "All" is visually active on load and featured section is unaffected
    setActiveFilterButton('filter-all');
    applyFilter('all');

    //SEARCH INPUT EXPAND/CONTRACT

    if (searchButton && searchInput) {
        // ensure smooth width transition
        if (!searchInput.style.transition) searchInput.style.transition = 'all 250ms ease-out';

        // Track current search state
        let isSearchActive = false;

        // Helper: update search active state based on input value
        function updateSearchActiveState() {
            const hasValue = searchInput.value.trim().length > 0;
            if (hasValue !== isSearchActive) {
                isSearchActive = hasValue;
                if (isSearchActive) {
                    searchButton.classList.add('active-filter');
                    searchInput.dataset.hasContent = 'true';
                } else {
                    searchButton.classList.remove('active-filter');
                    searchInput.dataset.hasContent = 'false';
                }
            }
        }

        // Handle search input on every keystroke
        searchInput.addEventListener('input', (e) => {
            const query = searchInput.value.trim();

            // Apply search filter in real-time
            applyFilter('search', query);

            // Update active state
            updateSearchActiveState();
        });

        // Handle search input on Enter key (submit)
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                applyFilter('search', query);
                updateSearchActiveState();
            }
            // Allow ESC to clear search
            if (e.key === 'Escape') {
                e.preventDefault();
                searchInput.value = '';
                applyFilter('search', '');
                updateSearchActiveState();
            }
        });

        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            const isExpanded = searchInput.dataset.expanded === 'true';
            const img = searchButton.querySelector('img');
            if (!isExpanded) {
                searchButton.style.padding = '6.5px 10px';
                searchButton.style.marginRight = '6px';
                searchButton.style.backgroundColor = '#2563eb';
                if (img) img.src = '../../Universal/Icons/search_white.svg';
                if (img) img.style.opacity = '1';
                if (img) img.style.width = '18px';
                if (img) img.style.height = '18px';

                searchInput.style.width = '892px';
                searchInput.style.height = 'calc(100% + 4px)';
                searchInput.style.padding = '0 55px 0 25px';
                searchInput.dataset.expanded = 'true';
                searchButton.setAttribute('aria-expanded', 'true');
                searchInput.focus();
            } else {
                searchButton.style.padding = '';
                searchButton.style.marginRight = '0';
                searchButton.style.backgroundColor = '';
                if (img) img.src = '../../Universal/Icons/search_black.svg';
                if (img) img.style.opacity = '';
                if (img) img.style.width = '';
                if (img) img.style.height = '';

                searchInput.style.width = '';
                searchInput.style.height = '';
                searchInput.style.padding = '';
                searchInput.dataset.expanded = 'false';
                searchButton.setAttribute('aria-expanded', 'false');

                // Clear search when collapsing
                searchInput.value = '';
                applyFilter('search', '');
                updateSearchActiveState();

                searchInput.blur();
            }
        });
    }
});

