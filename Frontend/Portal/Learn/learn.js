// Resource Search Filter - Optimized and Robust Implementation
const resourceSearchFilter = document.querySelector('.resource-search-filter');
const rsfContainer = document.querySelector('.rsf-container');
const filterTypes = document.querySelectorAll('.filter-type');
const filterSpan = resourceSearchFilter.querySelector('span');

let isFilterOpen = false;

// Utility: normalize text to a stable key (e.g. "All Resources" -> "all-resources")
function normalizeKey(text) {
    if (!text) return '';
    return text
        .toString()
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Assign `data-category` to each resource block based on visible tags inside it.
function assignDataCategories() {
    const resourceBlocks = document.querySelectorAll('.resource-block');
    resourceBlocks.forEach(rb => {
        // Look for tag containers inside resource block. Support a few markup variants.
        const tagEls = rb.querySelectorAll('.rbm-tags span, .rbm-tags .tag, .rbm-tags > *');
        let cats = [];
        if (tagEls && tagEls.length) {
            cats = Array.from(tagEls).map(t => t.textContent || '').filter(Boolean);
        }

        // Fallback: try to find a category label/badge in the head area
        if (!cats.length) {
            const headTag = rb.querySelector('.rbh-title span, .rbh-top .tag, .rbh-top span');
            if (headTag && headTag.textContent) cats.push(headTag.textContent);
        }

        // Normalize categories to keys and set as data attribute (space separated)
        const keys = cats.map(normalizeKey).filter(Boolean);
        rb.dataset.category = keys.length ? keys.join(' ') : 'uncategorized';
    });
}

// Relational mapping of filter keys to related tag keys.
// Keys should be normalized (use normalizeKey when adding new entries).
const RELATED_TAGS = {
    'programming': ['programming', 'coding', 'python', 'scratch', 'beginner', 'Web Development', 'Frontend', 'Backend'],
    'tech-in-africa': ['tech-in-africa', 'technology', 'digital-transformation', 'tech', 'digital'],
    'financial-literacy': ['financial-literacy', 'finance', 'investment', 'wealth-building', 'money'],
    'pan-africanism': ['pan-africanism', 'unity', 'african-renaissance', 'leadership', 'ubuntu'],
    'entrepreneurship': ['entrepreneurship', 'startup', 'business', 'innovation', 'tech-innovation'],
    'youth-development': ['youth-development', 'mentorship', 'empowerment', 'youth'],
    'all-resources': ['all-resources']
};

// Normalize RELATED_TAGS values so they are consistent with normalizeKey
Object.keys(RELATED_TAGS).forEach(k => {
    RELATED_TAGS[k] = Array.from(new Set(RELATED_TAGS[k].map(normalizeKey).filter(Boolean)));
});

// Current filter/search state
let currentCategoryKey = 'all-resources';
let currentSearchQuery = '';
// Keep original DOM order to restore when search cleared
let originalOrder = null;

// Simple debounce helper
function debounce(fn, wait = 200) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// Apply both category and text search filters together
function applyFilters() {
    const rbs = document.querySelectorAll('.resource-block');
    // Build accepted keys for the current category
    const key = currentCategoryKey;

    // If showing all, accepted will be empty (treated as match-any)
    const accepted = new Set();
    if (key && key !== 'all-resources' && key !== 'all') {
        ([key, ...(RELATED_TAGS[key] || [])]).forEach(k => accepted.add(normalizeKey(k)));
    }

    // Precompute mainAccepted for 'other' handling
    const mainCategoryKeys = Object.keys(RELATED_TAGS).filter(k => k !== 'all-resources' && k !== 'other');
    const mainAccepted = new Set();
    mainCategoryKeys.forEach(mc => RELATED_TAGS[mc].forEach(m => mainAccepted.add(normalizeKey(m))));

    const q = (currentSearchQuery || '').toString().trim().toLowerCase();

    rbs.forEach(rb => {
        const cats = (rb.dataset.category || '')
            .split(/\s+/)
            .map(normalizeKey)
            .filter(Boolean);

        const tagEls = rb.querySelectorAll('.rbm-tags span, .rbm-tags .resource-tag span');
        const tagKeys = Array.from(tagEls).map(t => normalizeKey(t.textContent || '')).filter(Boolean);

        const allKeys = new Set([...cats, ...tagKeys]);

        // Category match logic
        let categoryMatch = true;
        if (key && key !== 'all-resources' && key !== 'all') {
            if (key === 'other') {
                const intersectsMain = Array.from(allKeys).some(k => mainAccepted.has(k));
                categoryMatch = !intersectsMain;
            } else {
                categoryMatch = Array.from(accepted).some(a => allKeys.has(a));
            }
        }

        // Text search match logic - Use fuzzy matching for better results
        let searchMatch = true;
        if (q) {
            // Gather all searchable text
            const title = rb.querySelector('.rbh-title')?.textContent || '';
            const author = rb.querySelector('.rbh-author')?.textContent || '';
            const description = rb.querySelector('.rbm-resource-description')?.textContent || '';
            const tagEls = rb.querySelectorAll('.rbm-tags .resource-tag span');
            const tags = Array.from(tagEls).map(t => t.textContent || '').join(' ');
            const details = rb.querySelector('.rbm-details')?.textContent || '';

            const searchText = `${title} ${author} ${description} ${tags} ${details}`.toLowerCase();
            const qLower = q.toLowerCase();

            // Simple flexible matching: check if any word in the search starts with the query
            // or if query is a substring (handles "code" matching "coding")
            if (searchText.indexOf(qLower) !== -1) {
                searchMatch = true;
            } else {
                // Also check word-level fuzzy matching
                const searchWords = searchText.split(/\s+/);
                const queryWords = qLower.split(/\s+/);

                searchMatch = queryWords.some(qWord =>
                    searchWords.some(sWord =>
                        sWord.startsWith(qWord) ||
                        qWord.startsWith(sWord) ||
                        (sWord.length >= 3 && qWord.length >= 3 &&
                            (sWord.includes(qWord) || qWord.includes(sWord)))
                    )
                );
            }
        }

        if (categoryMatch && searchMatch) rb.style.display = '';
        else rb.style.display = 'none';
    });

    // Re-order visible results by relevance when there's an active search query
    try {
        const container = document.querySelector('.resource-container');
        if (container) {
            // Capture original order once
            if (!originalOrder) {
                originalOrder = Array.from(container.querySelectorAll('.resource-block'));
            }

            const visible = Array.from(container.querySelectorAll('.resource-block')).filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
            });

            if (currentSearchQuery && currentSearchQuery.length) {
                const q = currentSearchQuery.trim();

                // Build searchable items for Fuse.js
                const searchItems = visible.map(el => {
                    const title = el.querySelector('.rbh-title')?.textContent || '';
                    const author = el.querySelector('.rbh-author')?.textContent || '';
                    const description = el.querySelector('.rbm-resource-description')?.textContent || '';
                    const tagEls = el.querySelectorAll('.rbm-tags span, .rbm-tags .resource-tag span');
                    const tags = Array.from(tagEls).map(t => t.textContent || '').join(' ');
                    const details = el.querySelector('.rbm-details')?.textContent || '';

                    return {
                        el,
                        title,
                        author,
                        description,
                        tags,
                        details
                    };
                });

                // Configure Fuse.js for fuzzy search with weighted keys
                const fuseOptions = {
                    includeScore: true,
                    threshold: 0.4, // 0.0 = exact, 1.0 = match anything
                    distance: 100,
                    minMatchCharLength: 2,
                    keys: [
                        { name: 'title', weight: 0.5 },
                        { name: 'tags', weight: 0.25 },
                        { name: 'author', weight: 0.15 },
                        { name: 'description', weight: 0.07 },
                        { name: 'details', weight: 0.03 }
                    ]
                };

                // Use Fuse.js if available, fallback to original order
                if (typeof Fuse !== 'undefined') {
                    const fuse = new Fuse(searchItems, fuseOptions);
                    const results = fuse.search(q);

                    // Sort by Fuse score (lower score = better match)
                    results.forEach((result, idx) => {
                        container.appendChild(result.item.el);
                    });

                    // Append non-matching visible items at the end (shouldn't happen with current filter)
                    const matched = new Set(results.map(r => r.item.el));
                    visible.forEach(el => {
                        if (!matched.has(el)) container.appendChild(el);
                    });
                } else {
                    // Fallback: basic indexOf sorting if Fuse.js not loaded
                    const scored = visible.map(el => {
                        const text = (el.textContent || '').toLowerCase();
                        const qLower = q.toLowerCase();
                        const idx = text.indexOf(qLower);
                        return { el, score: idx === -1 ? 999999 : idx };
                    });
                    scored.sort((a, b) => a.score - b.score);
                    scored.forEach(s => container.appendChild(s.el));
                }
            } else {
                // restore original order for visible items
                if (originalOrder && originalOrder.length) {
                    originalOrder.forEach(node => {
                        // append only nodes that are currently in container (they should be)
                        if (container.contains(node)) container.appendChild(node);
                    });
                }
            }
        }
    } catch (err) {
        // don't block filtering on ordering errors
        // console.debug('reorder failed', err);
    }

    // Show a friendly 'no results' block when nothing is visible
    try {
        const container = document.querySelector('.resource-container');
        const noRes = container && container.querySelector('.no-resources-found');
        if (noRes) {
            const anyVisible = Array.from(rbs).some(rb => {
                // element may be hidden via inline style or CSS
                const style = window.getComputedStyle(rb);
                return style.display !== 'none' && style.visibility !== 'hidden' && rb.offsetParent !== null;
            });
            noRes.style.display = anyVisible ? 'none' : 'flex';
        }
    } catch (err) {
        // defensive: do not break filtering if DOM structure differs
        // console.debug('no-resources check failed', err);
    }
}

// Toggle filter dropdown
function toggleFilter(open) {
    const shouldOpen = open !== undefined ? open : !isFilterOpen;

    if (shouldOpen === isFilterOpen) return; // Prevent redundant operations

    isFilterOpen = shouldOpen;
    rsfContainer.classList.toggle('shown', shouldOpen);

    const borderColor = shouldOpen ? '#7c3aed' : '';
    resourceSearchFilter.style.borderColor = borderColor;
    resourceSearchFilter.style.outlineColor = borderColor;

    // Focus management
    if (shouldOpen) {
        // Focus first selected item or first item when opened
        const selectedFilter = rsfContainer.querySelector('.filter-type.selected') || filterTypes[0];
        if (selectedFilter) {
            requestAnimationFrame(() => selectedFilter.focus());
        }
    } else {
        // Return focus to button when closed
        resourceSearchFilter.focus();
    }
}

// Open/close filter
resourceSearchFilter.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFilter();
});

// Optimized filter selection
function selectFilter(filter) {
    if (!filter || filter.classList.contains('selected')) return; // Skip if already selected

    // Batch DOM updates
    requestAnimationFrame(() => {
        // Remove selected class from all filters
        filterTypes.forEach(f => {
            if (f !== filter) f.classList.remove('selected');
        });

        // Add selected class to clicked filter
        filter.classList.add('selected');

        // Update button text
        const filterText = filter.querySelector('span')?.textContent;
        if (filterText) {
            filterSpan.textContent = filterText;
        }

        // Close dropdown
        toggleFilter(false);

        // Apply resource filtering based on selected dropdown item
        const key = normalizeKey(filterText);
        if (key) {
            currentCategoryKey = key;
            applyFilters();
            // Also sync quick-filters UI to match if possible
            syncQuickFiltersToKey(key);
        }
    });
}

// Delegated event handling for better performance
rsfContainer.addEventListener('click', (e) => {
    e.stopPropagation();
    const filterType = e.target.closest('.filter-type');
    if (filterType) {
        selectFilter(filterType);
    }
});

// Keyboard navigation with proper ARIA support
rsfContainer.addEventListener('keydown', (e) => {
    const currentFilter = e.target.closest('.filter-type');
    if (!currentFilter) return;

    const currentIndex = Array.from(filterTypes).indexOf(currentFilter);
    let targetIndex = currentIndex;
    let handled = false;

    switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            selectFilter(currentFilter);
            handled = true;
            break;

        case 'ArrowDown':
            e.preventDefault();
            targetIndex = Math.min(currentIndex + 1, filterTypes.length - 1);
            handled = true;
            break;

        case 'ArrowUp':
            e.preventDefault();
            targetIndex = Math.max(currentIndex - 1, 0);
            handled = true;
            break;

        case 'Home':
            e.preventDefault();
            targetIndex = 0;
            handled = true;
            break;

        case 'End':
            e.preventDefault();
            targetIndex = filterTypes.length - 1;
            handled = true;
            break;

        case 'Escape':
            e.preventDefault();
            toggleFilter(false);
            handled = true;
            break;

        case 'Tab':
            // Allow natural tab behavior but close dropdown
            toggleFilter(false);
            break;
    }

    // Focus target if index changed
    if (handled && targetIndex !== currentIndex && filterTypes[targetIndex]) {
        filterTypes[targetIndex].focus();
    }
});

// Make search filter keyboard accessible
resourceSearchFilter.setAttribute('role', 'button');
resourceSearchFilter.setAttribute('aria-haspopup', 'listbox');
resourceSearchFilter.setAttribute('aria-expanded', 'false');
resourceSearchFilter.setAttribute('tabindex', '0');

// Update ARIA expanded state
const observer = new MutationObserver(() => {
    const isShown = rsfContainer.classList.contains('shown');
    resourceSearchFilter.setAttribute('aria-expanded', isShown.toString());
});
observer.observe(rsfContainer, { attributes: true, attributeFilter: ['class'] });

resourceSearchFilter.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFilter();
    } else if (e.key === 'ArrowDown' && !isFilterOpen) {
        e.preventDefault();
        toggleFilter(true);
    } else if (e.key === 'Escape' && isFilterOpen) {
        e.preventDefault();
        toggleFilter(false);
    }
});

// Optimized click outside handler with debounce
let closeTimeout;
document.addEventListener('click', (e) => {
    if (!isFilterOpen) return;

    if (!resourceSearchFilter.contains(e.target) && !rsfContainer.contains(e.target)) {
        clearTimeout(closeTimeout);
        closeTimeout = setTimeout(() => toggleFilter(false), 0);
    }
}, true); // Use capture phase for better performance

// Escape key handler
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFilterOpen) {
        e.preventDefault();
        toggleFilter(false);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    observer.disconnect();
    clearTimeout(closeTimeout);
});


// Grid/List Toggle Functionality
const gridBtn = document.querySelector('.grid-btn');
const listBtn = document.querySelector('.list-btn');
const activeGl = document.querySelector('.active-gl');
const activeGlSpan = activeGl.querySelector('span');
const activeGlImg = activeGl.querySelector('img');
// Container for resource blocks (used to switch layout between grid/list)
const resourceContainer = document.querySelector('.resource-container');

// When list button is clicked
listBtn.addEventListener('click', () => {

    // activeGl.style.right = '5px';
    activeGl.style.left = '55px';

    // Change inner span content from Grid to List
    activeGlSpan.textContent = 'List';

    // Set img src
    activeGlImg.src = '../../Universal/Icons/list_purple_1.svg';
    // Switch to list view: make resource blocks full width
    setListView(true);
});

// When grid button is clicked
gridBtn.addEventListener('click', () => {

    activeGl.style.left = '5px';
    // activeGl.style.right = 'auto';

    // Change inner span content back to Grid
    activeGlSpan.textContent = 'Grid';

    // Set img src
    activeGlImg.src = '../../Universal/Icons/grid_purple.svg';
    // Switch back to grid view: revert resource block sizing
    setListView(false);
});

// Helper: toggle list/grid layout for resource blocks
function setListView(isList) {
    // fallback if container not found
    const rbs = document.querySelectorAll('.resource-block');
    const rbht = document.querySelectorAll('.rbh-top');
    const rbmd = document.querySelectorAll('.rbm-details');


    if (!resourceContainer || !rbs) {
        // Still apply direct styles to blocks if container is missing
        rbs.forEach(rb => {
            rb.style.width = isList ? '100%' : '';
            rb.style.maxWidth = isList ? '100%' : '';
        });
        return;
    }

    if (isList) {
        // stack items vertically and stretch them
        resourceContainer.style.flexDirection = 'column';
        resourceContainer.style.alignItems = 'stretch';

        rbht.forEach(el => {
            el.style.gap = '8px';
            el.style.justifyContent = 'unset';
        });

        rbmd.forEach(el => {
            el.style.gap = '20px';
            el.style.justifyContent = 'unset';
        });

        rbs.forEach(rb => {
            rb.style.width = '100%';
            rb.style.maxWidth = '100%';
        });
    } else {
        // revert to CSS-driven grid behavior
        resourceContainer.style.flexDirection = '';
        resourceContainer.style.alignItems = '';

        rbht.forEach(el => {
            el.style.gap = '';
            el.style.justifyContent = '';
        });

        rbmd.forEach(el => {
            el.style.gap = '';
            el.style.justifyContent = '';
        });

        rbs.forEach(rb => {
            rb.style.width = '';
            rb.style.maxWidth = '';
        });
    }
}

// When hovering over active-gl
activeGl.addEventListener('mouseenter', () => {
    // Set inner span display to none
    activeGlSpan.style.opacity = '0';

    // Set img to flex
    activeGlImg.style.opacity = '1';
});

// When leaving hover on active-gl
activeGl.addEventListener('mouseleave', () => {
    // Set inner span display back to flex
    activeGlSpan.style.opacity = '1';

    // Set img display back to its default (flex)
    activeGlImg.style.opacity = '0';
});

// Search input handling (debounced)
const resourceSearchInput = document.querySelector('#resource-search');
if (resourceSearchInput) {
    const onSearch = debounce((e) => {
        currentSearchQuery = (e.target.value || '').trim();
        applyFilters();
    }, 220);

    resourceSearchInput.addEventListener('input', onSearch);

    // Allow pressing Enter to immediately apply
    resourceSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            currentSearchQuery = (resourceSearchInput.value || '').trim();
            applyFilters();
        }
    });
}


// Quick Filter Toggle Functionality
const quickFilters = document.querySelectorAll('.quick-filter');

quickFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        // Remove selected class from all quick filters and update icons
        quickFilters.forEach(qf => {
            qf.classList.remove('selected');
            const img = qf.querySelector('.qf-icon img');
            if (img) {
                // Special case for al-qf (All Resources) - use book_purple_1.svg
                if (qf.classList.contains('al-qf')) {
                    img.src = img.src.replace('book_white_1.svg', 'book_purple_1.svg');
                } else {
                    img.src = img.src.replace('_white.svg', '_purple.svg');
                }
            }
        });

        // Add selected class to clicked filter and update icon
        filter.classList.add('selected');
        const img = filter.querySelector('.qf-icon img');
        if (img) {
            if (filter.classList.contains('al-qf')) {
                img.src = img.src.replace('book_purple_1.svg', 'book_white_1.svg');
            } else {
                img.src = img.src.replace('_purple.svg', '_white.svg');
            }
        }

        // Apply the filter to resources and sync dropdown
        const text = filter.querySelector('span')?.textContent || filter.textContent || '';
        const key = normalizeKey(text);
        if (key) {
            // set state and apply combined filters
            currentCategoryKey = key;
            applyFilters();
            // Update dropdown button text to match quick filter
            filterSpan.textContent = text.trim();
            // Try to set dropdown selection visually
            const matchingFilter = Array.from(filterTypes).find(ft => normalizeKey(ft.querySelector('span')?.textContent) === key);
            if (matchingFilter) {
                filterTypes.forEach(f => f.classList.toggle('selected', f === matchingFilter));
            }
        }
    });
});


// --- Filtering helpers -------------------------------------------------
// Show/hide resource blocks by normalized category key
function filterResources(key) {
    // set global state and re-use applyFilters
    currentCategoryKey = key || 'all-resources';
    applyFilters();
}

// Sync quick-filters UI to a normalized key
function syncQuickFiltersToKey(key) {
    quickFilters.forEach(qf => {
        const text = qf.querySelector('span')?.textContent || qf.textContent || '';
        qf.classList.toggle('selected', normalizeKey(text) === key);
        // update icons when toggling
        const img = qf.querySelector('.qf-icon img');
        if (!img) return;
        if (qf.classList.contains('selected')) {
            if (qf.classList.contains('al-qf')) img.src = img.src.replace('book_purple_1.svg', 'book_white_1.svg');
            else img.src = img.src.replace('_purple.svg', '_white.svg');
        } else {
            if (qf.classList.contains('al-qf')) img.src = img.src.replace('book_white_1.svg', 'book_purple_1.svg');
            else img.src = img.src.replace('_white.svg', '_purple.svg');
        }
    });
}

// Try to sync dropdown filter types by adding a dataset value
filterTypes.forEach(ft => {
    const t = ft.querySelector('span')?.textContent || ft.textContent || '';
    ft.dataset.value = normalizeKey(t);
});

// Initial setup: assign categories then apply currently selected quick-filter (if any)
assignDataCategories();
const initialQ = document.querySelector('.quick-filter.selected');
if (initialQ) {
    const t = initialQ.querySelector('span')?.textContent || initialQ.textContent || '';
    const k = normalizeKey(t);
    if (k) filterResources(k);
}
