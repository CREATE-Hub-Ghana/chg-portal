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
            // The message textarea uses a different container (.inquiry-message-container)
            // so include that selector as well when searching for the error span.
            try {
                const blk = el.closest && el.closest('.is-block, .inquiry-message-container');
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
                const blk = el.closest && el.closest('.is-block, .inquiry-message-container');
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
        const hasName = fullName && new RegExp("^\\s*" + namePart + "(?:\\s+" + namePart + ")+\\s*$", 'u').test(fullName.value || '');
        errors.fullName = !hasName;

        // Email: simple regex
        const hasEmail = emailAddress && /\S+@\S+\.\S+/.test(emailAddress.value.trim());
        errors.emailAddress = !hasEmail;

        // Subject: require at least 2 chars
        const hasSubject = emailSubject && emailSubject.value.trim().length > 1;
        errors.emailSubject = !hasSubject;

        // Inquiry type: ensure a selection has been made (data-selected attribute)
        const hasType = inquiryBtn && inquiryBtn.getAttribute('data-selected') && inquiryBtn.getAttribute('data-selected').trim().length > 0;
        errors.inquiryType = !hasType;

        // Message: require at least 4 chars
        const hasMessage = inquiryMessage && inquiryMessage.value.trim().length >= 4;
        errors.inquiryMessage = !hasMessage;

        // Toggle outlines for all fields (full form validation) with specific messages
        toggleOutline(fullName, errors.fullName, errors.fullName ? 'Enter full name e.g. John Doe' : undefined);
        toggleOutline(emailAddress, errors.emailAddress, errors.emailAddress ? 'Enter a valid email address' : undefined);
        toggleOutline(emailSubject, errors.emailSubject, errors.emailSubject ? 'Enter a subject (min 2 characters)' : undefined);
        toggleOutline(inquiryMessage, errors.inquiryMessage, errors.inquiryMessage ? 'Enter message (min 4 characters)' : undefined);
        toggleOutline(inquiryBtn, errors.inquiryType, errors.inquiryType ? 'Select an inquiry type' : undefined);

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
                    isError = !(fullName && re.test(fullName.value || ''));
                    toggleOutline(fullName, isError, isError ? 'Enter full name e.g. John Doe' : undefined);
                }
                break;
            case 'emailAddress':
                isError = !(emailAddress && /\S+@\S+\.\S+/.test(emailAddress.value.trim()));
                toggleOutline(emailAddress, isError, isError ? 'Enter a valid email address' : undefined);
                break;
            case 'emailSubject':
                isError = !(emailSubject && emailSubject.value.trim().length > 1);
                toggleOutline(emailSubject, isError, isError ? 'Enter a subject (min 2 characters)' : undefined);
                break;
            case 'inquiryMessage':
                isError = !(inquiryMessage && inquiryMessage.value.trim().length >= 4);
                toggleOutline(inquiryMessage, isError, isError ? 'Enter message (min 4 characters)' : undefined);
                break;
            case 'inquiryType':
                isError = !(inquiryBtn && inquiryBtn.getAttribute('data-selected') && inquiryBtn.getAttribute('data-selected').trim().length > 0);
                toggleOutline(inquiryBtn, isError, isError ? 'Select an inquiry type' : undefined);
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
    validateFieldOnBlur(emailSubject, 'emailSubject', 2);
    // For message, we only run validation on blur if user typed >1 char; full
    // validity still requires >4 chars.
    validateFieldOnBlur(inquiryMessage, 'inquiryMessage', 2);

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
                } else if (errs.emailAddress && emailAddress) {
                    emailAddress.focus();
                } else if (errs.emailSubject && emailSubject) {
                    emailSubject.focus();
                } else if (errs.inquiryType && inquiryBtn) {
                    inquiryBtn.focus();
                } else if (errs.inquiryMessage && inquiryMessage) {
                    inquiryMessage.focus();
                }
                return;
            }

            // Build payload and simulate send
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

// Email selection modal logic
(function () {
    const body = document.querySelector('body');
    const sendMailBtn = document.getElementById('send-mail');
    const callNowBtn = document.getElementById('call-now');
    const modal = document.getElementById('email-select-modal');
    if (!modal) return;

    const backdrop = modal.querySelector('.modal-backdrop');
    const closeButtons = modal.querySelectorAll('[data-action="close"]');
    const actionsContainer = modal.querySelector('.modal-actions');
    const modalTitle = modal.querySelector('#modal-title');
    const modalPara = modal.querySelector('p');

    // toast element (dynamically added)
    let toast = document.getElementById('action-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'action-toast';
        toast.className = 'action-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }

    function showModalFor(type) {
        // clear existing actions
        actionsContainer.innerHTML = '';
        if (type === 'email') {
            modalTitle.textContent = 'Choose recipient';
            if (modalPara) modalPara.textContent = 'Select which email address you want to use to contact Create Hub Ghana.';
            const emails = ['info@createhubghana.com', 'support@createhubghana.com'];
            emails.forEach((em) => {
                const btn = document.createElement('button');
                btn.className = 'modal-option';
                btn.type = 'button';
                btn.dataset.email = em;
                btn.textContent = em;
                actionsContainer.appendChild(btn);
            });
        } else if (type === 'call') {
            modalTitle.textContent = 'Choose number';
            if (modalPara) modalPara.textContent = 'Select which phone number you want to call.';
            const phones = ['+233249097323', '+233594849077'];
            phones.forEach((ph) => {
                const btn = document.createElement('button');
                btn.className = 'modal-option';
                btn.type = 'button';
                btn.dataset.phone = ph;
                // display readable phone
                const pretty = ph.replace(/(\+233)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
                btn.textContent = pretty;
                actionsContainer.appendChild(btn);
            });
        }

        // attach handlers to options
        const opts = Array.from(actionsContainer.querySelectorAll('.modal-option'));
        opts.forEach((opt) => {
            opt.addEventListener('click', function (e) {
                if (opt.dataset.email) {
                    hideModal();
                    openMailTo(opt.dataset.email);
                    showToast('Mail client opened');
                } else if (opt.dataset.phone) {
                    hideModal();
                    openPhone(opt.dataset.phone);
                    showToast('Dialer opened');
                }
            });

            opt.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    opt.click();
                } else if (e.key === 'Escape' || e.key === 'Esc') {
                    e.preventDefault();
                    hideModal();
                }
            });
        });

        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('shown');
        body.style.overflow = 'hidden'; // prevent background scroll
        const first = actionsContainer.querySelector('.modal-option');
        if (first) first.focus();
    }

    function hideModal() {
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('shown');
        body.style.overflow = '';
        // return focus to the last trigger if present
        const lastTrigger = document.querySelector('[data-modal-active]');
        if (lastTrigger) {
            lastTrigger.removeAttribute('data-modal-active');
            lastTrigger.focus();
        }
    }

    // Build mailto and open user's mail client
    function openMailTo(recipient) {
        const subject = encodeURIComponent(document.getElementById('email-subject')?.value || '');
        const bodyParts = [];
        const name = document.getElementById('full-name')?.value;
        const message = document.getElementById('inquiry-message')?.value;
        if (name) bodyParts.push('Name: ' + name);
        if (message) bodyParts.push('\n\n' + message);
        const bodyStr = encodeURIComponent(bodyParts.join('\n'));

        const mailto = `mailto:${recipient}?subject=${subject}&body=${bodyStr}`;
        window.location.href = mailto;
    }

    function openPhone(phone) {
        // use tel: link
        window.location.href = `tel:${phone}`;
    }

    // Toast helpers
    let toastTimer = null;
    function showToast(text, ms = 2500) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('visible');
        }, ms);
    }

    // attach triggers
    [sendMailBtn, callNowBtn].forEach((btn) => {
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const type = btn.dataset.modalType || btn.getAttribute('data-modal-type') || btn.getAttribute('data-modaltype') || btn.getAttribute('data-type') || 'email';
            // mark active for focus return
            btn.setAttribute('data-modal-active', 'true');
            showModalFor(type);
        });
    });

    // close on backdrop or explicit close
    backdrop.addEventListener('click', hideModal);
    closeButtons.forEach((b) => b.addEventListener('click', hideModal));

    // Escape to close modal
    document.addEventListener('keydown', function (e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && modal.classList.contains('shown')) {
            hideModal();
        }
    });
})();
