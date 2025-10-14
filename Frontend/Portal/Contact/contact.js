// Contact page interactions: inquiry type select, its-container toggle, selection,
// outside click and Escape handling, and simple form submission placeholder.

(function () {
    'use strict';

    // Elements
    const inquiryBtn = document.getElementById('inquiry-type-select');
    const itsContainer = document.querySelector('.its-container');
    const inquiryTypes = Array.from(document.querySelectorAll('.its-container .inquiry-type'));
    const sendBtn = document.getElementById('send-inquiry-message');
    const fullName = document.getElementById('full-name');
    const emailAddress = document.getElementById('email-address');
    const emailSubject = document.getElementById('email-subject');
    const inquiryMessage = document.getElementById('inquiry-message');

    if (!inquiryBtn || !itsContainer) return; // nothing to do

    // Accessibility: make button act like a combobox/listbox trigger
    inquiryBtn.setAttribute('aria-haspopup', 'listbox');
    inquiryBtn.setAttribute('aria-expanded', 'false');
    inquiryBtn.setAttribute('role', 'button');

    // Mark up options for screen readers
    itsContainer.setAttribute('role', 'listbox');
    inquiryTypes.forEach((opt, idx) => {
        opt.setAttribute('role', 'option');
        opt.setAttribute('tabindex', '-1');
        opt.dataset.index = String(idx);
    });

    // Hidden value to store selection (we'll reuse data attribute on button)
    function setSelection(text) {
        inquiryBtn.querySelector('span')?.remove(); // remove extra span if present
        // Set the button text content while preserving the chevron
        // The button markup in HTML contains text and a .select-icon div; keep the icon.
        // We'll set a data-selected attribute for form use.
        inquiryBtn.setAttribute('data-selected', text);
        // Update visible label: replace text node but keep .select-icon
        const icon = inquiryBtn.querySelector('.select-icon');
        inquiryBtn.textContent = text;
        if (icon) inquiryBtn.appendChild(icon);
    }

    // Initialize with currently selected item
    const initial = inquiryTypes.find((it) => it.classList.contains('selected'));
    if (initial) setSelection(initial.textContent.trim());

    function openDropdown() {
        itsContainer.classList.add('shown');
        inquiryBtn.setAttribute('aria-expanded', 'true');
        inquiryBtn.style.outlineColor = "#2563eb";
        // move focus into the listbox: focused item is selected or first
        const selected = inquiryTypes.find((it) => it.classList.contains('selected')) || inquiryTypes[0];
        if (selected) selected.focus();
    }

    function closeDropdown() {
        itsContainer.classList.remove('shown');
        inquiryBtn.setAttribute('aria-expanded', 'false');
        inquiryBtn.style.outlineColor = "";
    }

    // Toggle on button click
    inquiryBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (itsContainer.classList.contains('shown')) closeDropdown();
        else openDropdown();
    });

    // Keyboard handling on trigger button
    inquiryBtn.addEventListener('keydown', function (e) {
        const key = e.key;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
            // Enter or Space toggles
            e.preventDefault();
            if (itsContainer.classList.contains('shown')) closeDropdown();
            else openDropdown();
        } else if (key === 'ArrowDown') {
            // open and focus first/selected
            e.preventDefault();
            if (!itsContainer.classList.contains('shown')) openDropdown();
            else {
                const next = inquiryTypes[0];
                if (next) next.focus();
            }
        }
    });

    // Handle selection clicks
    inquiryTypes.forEach((el) => {
        el.addEventListener('click', function (e) {
            e.stopPropagation();
            inquiryTypes.forEach((x) => x.classList.remove('selected'));
            el.classList.add('selected');
            const txt = el.textContent.trim();
            setSelection(txt);
            closeDropdown();
        });

        // keyboard navigation and selection inside listbox
        el.addEventListener('keydown', function (e) {
            const key = e.key;
            const idx = Number(el.dataset.index || 0);
            if (key === 'ArrowDown') {
                e.preventDefault();
                const next = inquiryTypes[idx + 1] || inquiryTypes[0];
                next.focus();
            } else if (key === 'ArrowUp') {
                e.preventDefault();
                const prev = inquiryTypes[idx - 1] || inquiryTypes[inquiryTypes.length - 1];
                prev.focus();
            } else if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
                e.preventDefault();
                // select
                inquiryTypes.forEach((x) => x.classList.remove('selected'));
                el.classList.add('selected');
                setSelection(el.textContent.trim());
                closeDropdown();
                inquiryBtn.focus();
            } else if (key === 'Escape' || key === 'Esc') {
                e.preventDefault();
                closeDropdown();
                inquiryBtn.focus();
            }
        });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
        if (!itsContainer.contains(e.target) && e.target !== inquiryBtn) {
            if (itsContainer.classList.contains('shown')) closeDropdown();
        }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (itsContainer.classList.contains('shown')) closeDropdown();
        }
    });

    // Basic validation for send button (enable/disable)
    function validateForm() {
        const hasName = fullName && fullName.value.trim().length > 1;
        const hasEmail = emailAddress && /\S+@\S+\.\S+/.test(emailAddress.value);
        const hasMessage = inquiryMessage && inquiryMessage.value.trim().length > 4;
        if (sendBtn) sendBtn.disabled = !(hasName && hasEmail && hasMessage);
    }

    [fullName, emailAddress, inquiryMessage].forEach((el) => {
        if (!el) return;
        el.addEventListener('input', validateForm);
    });

    // Prevent default submit; simulate send (placeholder)
    if (sendBtn) {
        // initialize disabled state
        validateForm();

        sendBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // Basic feedback: if disabled, do nothing
            if (sendBtn.disabled) return;

            const payload = {
                name: fullName.value.trim(),
                email: emailAddress.value.trim(),
                subject: emailSubject.value.trim(),
                type: inquiryBtn.getAttribute('data-selected') || null,
                message: inquiryMessage.value.trim(),
                subscribe: !!document.getElementById('nl-subscribe')?.checked,
            };

            // For now just log; in a real app this would POST to a backend endpoint
            // Keep console log for debug in browser devtools.
            console.log('Send inquiry payload:', payload);

            // Simple UX: show a temporary confirmation
            sendBtn.textContent = 'Sending...';
            sendBtn.disabled = true;
            setTimeout(() => {
                sendBtn.textContent = 'Send Message';
                validateForm();
                // Optionally clear fields on success
                // fullName.value = '';
                // emailAddress.value = '';
                // emailSubject.value = '';
                // inquiryMessage.value = '';
                alert('Your message has been queued for sending.');
            }, 700);
        });
    }

})();
