// Support page interactions: partnership interest select, pis-container toggle, selection,
// outside click and Escape handling, and simple form submission placeholder.

(function () {
    'use strict';

    // Elements (support page: partnership interest selector)
    const inquiryBtn = document.getElementById('partnership-interest-select');
    const itsContainer = document.querySelector('.pis-container');
    const inquiryTypes = Array.from(document.querySelectorAll('.pis-container .partnership-interest'));
    const sendBtn = document.getElementById('send-partnership-message');
    const fullName = document.getElementById('full-name');
    const organization = document.getElementById('organization');
    const emailAddress = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const inquiryMessage = document.getElementById('partnership-reason');

    if (!inquiryBtn || !itsContainer) return; // nothing to do on pages without partnership UI

    // Hide any inline error message spans on startup
    try {
        Array.from(document.querySelectorAll('.error-message')).forEach((s) => (s.style.display = 'none'));
    } catch (e) {
        /* ignore */
    }

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
    // Close on outside click (works for desktop and mobile taps)
    document.addEventListener('click', function (e) {
        if (!itsContainer.contains(e.target) && e.target !== inquiryBtn) {
            if (itsContainer.classList.contains('shown')) closeDropdown();
        }
    });

    // Close on Escape
    // Close on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (itsContainer.classList.contains('shown')) closeDropdown();
        }
    });

    // Toggle error outline classes for a single element (module-level helper)
    function toggleOutline(el, isError, message) {
        if (!el) return;
        if (isError) {
            el.classList.add('input-error');
            // for buttons (inquiryBtn) also set outline style
            if (el instanceof HTMLButtonElement) {
                el.style.outline = '2px solid #dc2626';
                el.style.outlineOffset = '2px';
            }
            // show an inline error message if present in the same wrapper
            // The partnership message textarea uses a different container
            // so include that selector when searching for the error span.
            try {
                const blk = el.closest && el.closest('.is-block, .partnership-reason-container');
                const span = blk && blk.querySelector && blk.querySelector('.error-message');
                if (span) {
                    span.style.display = 'block';
                    // show custom message when provided, otherwise default text
                    span.textContent = message || 'This field is required';
                }
            } catch (e) {
                /* ignore */
            }
        } else {
            el.classList.remove('input-error');
            if (el instanceof HTMLButtonElement) {
                el.style.outline = '';
                el.style.outlineOffset = '';
            }
            try {
                const blk = el.closest && el.closest('.is-block, .partnership-reason-container');
                const span = blk && blk.querySelector && blk.querySelector('.error-message');
                if (span) span.style.display = 'none';
            } catch (e) {
                /* ignore */
            }
        }
    }

    // Basic validation for send button (enable/disable)
    function validateForm() {
        const errors = {};

        // Name: require at least two words (e.g. "John Doe"). Each word may
        // include letters (including accented/Unicode letters), hyphens,
        // apostrophes, or periods. Consecutive punctuation is disallowed because
        // punctuation must be followed by a letter. Examples: "O'Connor",
        // "Anne-Marie", "J. Doe".
        // We use \p{L} with the Unicode flag to allow accented letters.
        const namePart = "\\p{L}+(?:[.'-]\\p{L}+)*\\.?"; // one name token
        const nameVal = (fullName && fullName.value || '').trim();
        const hasName = fullName && new RegExp("^\\s*" + namePart + "(?:\\s+" + namePart + ")+\\s*$", 'u').test(nameVal);
        // Detect characters we disallow in names: anything not a letter,
        // space, hyphen, apostrophe, or period. Use Unicode property for letters.
        const nameHasForbidden = /[^\p{L}\s.'-]/u.test(nameVal);
        errors.fullName = !hasName || nameHasForbidden;

        // Email: simple regex (support page uses id="email")
        const hasEmail = emailAddress && /\S+@\S+\.\S+/.test((emailAddress.value || '').trim());
        errors.emailAddress = !hasEmail;

        // Organization: required and at least 2 characters
        // Allow common organization characters: letters, numbers, spaces,
        // hyphen, ampersand, apostrophe, period, comma, parentheses and slash.
        const orgVal = (organization && organization.value || '').trim();
        const orgHasForbidden = /[^\p{L}\p{N}\s\.,&'()\/-]/u.test(orgVal);
        const hasOrg = orgVal.length >= 2 && !orgHasForbidden;
        errors.organization = !hasOrg;

        // Phone: allow +, spaces, hyphens, but require 7-15 digits
        const phoneVal = (phoneInput && phoneInput.value || '').trim();
        const digitsOnly = phoneVal.replace(/[^0-9]/g, '');
        const hasPhone = digitsOnly.length >= 7 && digitsOnly.length <= 15;
        errors.phone = !hasPhone;

        // Partnership interest: ensure a selection has been made (data-selected attribute)
        const hasType = inquiryBtn && inquiryBtn.getAttribute('data-selected') && inquiryBtn.getAttribute('data-selected').trim().length > 0;
        errors.inquiryType = !hasType;

        // Message: require at least 4 chars
        const hasMessage = inquiryMessage && inquiryMessage.value && inquiryMessage.value.trim().length >= 4;
        errors.inquiryMessage = !hasMessage;

        // Toggle outlines for all fields (full form validation) with specific messages
        // If the name contains forbidden symbols show a symbol-specific message.
        const nameMsg = nameHasForbidden ? 'Do not include symbols or numbers in the name' : (errors.fullName ? 'Enter full name e.g. John Doe' : undefined);
        toggleOutline(fullName, errors.fullName, nameMsg);
        toggleOutline(emailAddress, errors.emailAddress, errors.emailAddress ? 'Enter a valid email address' : undefined);
        const orgMsg = orgHasForbidden ? 'Do not include unusual symbols in organization name' : (errors.organization ? 'Enter organization name' : undefined);
        toggleOutline(organization, errors.organization, orgMsg);
        toggleOutline(phoneInput, errors.phone, errors.phone ? 'Enter a valid phone number' : undefined);
        toggleOutline(inquiryMessage, errors.inquiryMessage, errors.inquiryMessage ? 'Enter message (min 4 characters)' : undefined);
        toggleOutline(inquiryBtn, errors.inquiryType, errors.inquiryType ? 'Select a partnership interest' : undefined);

        // disable send button if any errors
        const hasAnyError = Object.values(errors).some(Boolean);
        if (sendBtn) sendBtn.disabled = hasAnyError;

        return { errors, hasAnyError };
    }

    // Validate a single field by key and toggle outline only for that field
    function validateSingle(fieldKey) {
        let isError = false;
        switch (fieldKey) {
            case 'fullName':
                {
                    const namePart = "\\p{L}+(?:[.'-]\\p{L}+)*\\.?";
                    const re = new RegExp("^\\s*" + namePart + "(?:\\s+" + namePart + ")+\\s*$", 'u');
                    const val = (fullName && fullName.value || '').trim();
                    const hasForbidden = /[^\p{L}\s.'-]/u.test(val);
                    isError = !(fullName && re.test(val)) || hasForbidden;
                    const msg = hasForbidden ? 'Do not include symbols or numbers in the name' : 'Enter full name e.g. John Doe';
                    toggleOutline(fullName, isError, isError ? msg : undefined);
                }
                break;
            case 'emailAddress':
                isError = !(emailAddress && /\S+@\S+\.\S+/.test(emailAddress.value.trim()));
                toggleOutline(emailAddress, isError, isError ? 'Enter a valid email address' : undefined);
                break;
            case 'emailSubject':
                {
                }
                break;
            case 'inquiryMessage':
                isError = !(inquiryMessage && inquiryMessage.value.trim().length >= 4);
                toggleOutline(inquiryMessage, isError, isError ? 'Enter message (min 4 characters)' : undefined);
                break;
            case 'organization':
                {
                    const val = (organization && organization.value || '').trim();
                    const orgHasForbiddenLocal = /[^\p{L}\p{N}\s\.,&'()\/-]/u.test(val);
                    const ok = val.length >= 2 && !orgHasForbiddenLocal;
                    isError = !ok;
                    const msg = orgHasForbiddenLocal ? 'Do not include unusual symbols in organization name' : 'Enter organization name';
                    toggleOutline(organization, isError, isError ? msg : undefined);
                }
                break;
            case 'phone':
                {
                    const val = (phoneInput && phoneInput.value || '').trim();
                    const digits = val.replace(/[^0-9]/g, '');
                    const ok = digits.length >= 7 && digits.length <= 15;
                    isError = !ok;
                    toggleOutline(phoneInput, isError, isError ? 'Enter a valid phone number' : undefined);
                }
                break;
            case 'inquiryType':
                isError = !(inquiryBtn && inquiryBtn.getAttribute('data-selected') && inquiryBtn.getAttribute('data-selected').trim().length > 0);
                toggleOutline(inquiryBtn, isError, isError ? 'Select a partnership interest' : undefined);
                break;
            case 'emailAddress':
                isError = !(emailAddress && /\S+@\S+\.\S+/.test((emailAddress.value || '').trim()));
                toggleOutline(emailAddress, isError, isError ? 'Enter a valid email address' : undefined);
                break;
            default:
                break;
        }
        return isError;
    }

    // We only validate when the user clicks Send. This avoids showing errors
    // while the user is typing or on initial page load. Additionally, we add
    // blur handlers so that a field is validated when the user leaves it,
    // but only if they've typed more than 1 character (so empty fields don't
    // show errors immediately).
    function validateFieldOnBlur(fieldEl, fieldKey, minCharsForCheck = 2) {
        if (!fieldEl) return;
        fieldEl.addEventListener('focusout', function () {
            const val = (fieldEl.value || '').trim();
            if (val.length >= minCharsForCheck) {
                // validate only this specific field to avoid toggling others
                validateSingle(fieldKey);
            } else {
                // if too short, remove any outline so blank fields remain neutral
                fieldEl.classList.remove('input-error');
                if (fieldEl instanceof HTMLButtonElement) {
                    fieldEl.style.outline = '';
                    fieldEl.style.outlineOffset = '';
                }
            }
        });
    }

    // Apply blur validation to inputs and textarea
    // Validate full name on blur even when user has typed a single character
    // so that an invalid single-word name like "K" will show an error.
    validateFieldOnBlur(fullName, 'fullName', 1);
    validateFieldOnBlur(emailAddress, 'emailAddress', 2);
    validateFieldOnBlur(organization, 'organization', 2);
    validateFieldOnBlur(phoneInput, 'phone', 2);
    // For message, we only run validation on blur if user typed >1 char; full
    // validity still requires >4 chars.
    validateFieldOnBlur(inquiryMessage, 'inquiryMessage', 2);

    // Show symbol-specific error while the user is typing in the name field.
    if (fullName) {
        fullName.addEventListener('input', function () {
            const val = (fullName.value || '').trim();
            // only show the symbol error; structural (two-name) validation
            // remains on blur/send
            const hasForbidden = /[^\p{L}\s.'-]/u.test(val);
            if (hasForbidden) {
                toggleOutline(fullName, true, 'Do not include symbols or numbers in the name');
            } else {
                // remove symbol error when characters are clean; keep other
                // outline state (structural errors will be applied on blur/send)
                // so we only clear if the current class is input-error and the
                // message matches our symbol text.
                try {
                    const blk = fullName.closest && fullName.closest('.is-block, .partnership-reason-container');
                    const span = blk && blk.querySelector && blk.querySelector('.error-message');
                    if (span && span.textContent && span.textContent.indexOf('Do not include symbols') === 0) {
                        span.style.display = 'none';
                    }
                    fullName.classList.remove('input-error');
                } catch (e) { /* ignore */ }
            }
        });
    }

    // Mirror: show symbol-specific error while typing in Subject input.
    // live validation for email field
    if (emailAddress) {
        emailAddress.addEventListener('input', function () {
            const val = (emailAddress.value || '').trim();
            const ok = /\S+@\S+\.\S+/.test(val);
            if (!ok && val.length > 0) {
                toggleOutline(emailAddress, true, 'Enter a valid email address');
            } else {
                try {
                    const blk = emailAddress.closest && emailAddress.closest('.is-block');
                    const span = blk && blk.querySelector && blk.querySelector('.error-message');
                    if (span && span.textContent && span.textContent.indexOf('Enter a valid email') === 0) {
                        span.style.display = 'none';
                    }
                    emailAddress.classList.remove('input-error');
                } catch (e) { /* ignore */ }
            }
        });
    }

    // live validation for organization field: prohibit unusual symbols
    if (organization) {
        organization.addEventListener('input', function () {
            const val = (organization.value || '').trim();
            const hasForbidden = /[^\p{L}\p{N}\s\.,&'()\/-]/u.test(val);
            if (hasForbidden) {
                toggleOutline(organization, true, 'Do not include unusual symbols in organization name');
            } else {
                try {
                    const blk = organization.closest && organization.closest('.is-block');
                    const span = blk && blk.querySelector && blk.querySelector('.error-message');
                    if (span && span.textContent && span.textContent.indexOf('Do not include unusual symbols') === 0) {
                        span.style.display = 'none';
                    }
                    organization.classList.remove('input-error');
                } catch (e) { /* ignore */ }
            }
        });
    }

    // phone live validation
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            const val = (phoneInput.value || '').trim();
            const digits = val.replace(/[^0-9]/g, '');
            const ok = digits.length >= 7 && digits.length <= 15;
            if (!ok && val.length > 0) {
                toggleOutline(phoneInput, true, 'Enter a valid phone number');
            } else {
                try {
                    const blk = phoneInput.closest && phoneInput.closest('.is-block');
                    const span = blk && blk.querySelector && blk.querySelector('.error-message');
                    if (span && span.textContent && span.textContent.indexOf('Enter a valid phone') === 0) {
                        span.style.display = 'none';
                    }
                    phoneInput.classList.remove('input-error');
                } catch (e) { /* ignore */ }
            }
        });
    }

    // Also validate when a selection is explicitly made from the dropdown
    inquiryTypes.forEach((el) => el.addEventListener('click', function () {
        // selection happened, update visuals for inquiry type only
        validateSingle('inquiryType');
    }));

    if (sendBtn) {
        sendBtn.addEventListener('click', function (e) {
            e.preventDefault();

            const result = validateForm();

            // If there are validation errors, focus the first invalid field and stop
            if (result && result.hasAnyError) {
                const errs = result.errors;
                if (errs.fullName && fullName) {
                    fullName.focus();
                } else if (errs.organization && organization) {
                    organization.focus();
                } else if (errs.emailAddress && emailAddress) {
                    emailAddress.focus();
                } else if (errs.phone && phoneInput) {
                    phoneInput.focus();
                } else if (errs.inquiryType && inquiryBtn) {
                    inquiryBtn.focus();
                } else if (errs.inquiryMessage && inquiryMessage) {
                    inquiryMessage.focus();
                }
                return;
            }

            // Build payload and simulate send
            const payload = {
                name: (fullName.value || '').trim(),
                organization: (organization && organization.value || '').trim(),
                email: (emailAddress && emailAddress.value || '').trim(),
                phone: (phoneInput && phoneInput.value || '').trim(),
                type: inquiryBtn.getAttribute('data-selected') || null,
                message: (inquiryMessage && inquiryMessage.value || '').trim(),
            };

            // For now just log; in a real app this would POST to a backend endpoint
            console.log('Send partnership payload:', payload);

            // Simple UX: show a temporary confirmation
            const prevText = sendBtn.textContent;
            sendBtn.textContent = 'Sending...';
            sendBtn.disabled = true;
            setTimeout(() => {
                // restore and give feedback
                sendBtn.textContent = prevText;
                sendBtn.disabled = false;
                validateForm();
                // Optionally clear fields on success
                if (fullName) fullName.value = '';
                if (organization) organization.value = '';
                if (emailAddress) emailAddress.value = '';
                if (phoneInput) phoneInput.value = '';
                if (inquiryMessage) inquiryMessage.value = '';
                // clear selection
                inquiryBtn.removeAttribute('data-selected');
                inquiryTypes.forEach((x) => x.classList.remove('selected'));
                alert('Your partnership message has been queued for sending.');
            }, 700);
        });
    }

})();