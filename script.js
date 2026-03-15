(function () {
    function escapeRegExp(text) {
        return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function slugifyTitle(title, options) {
        const sep = options && options.sepchar ? options.sepchar : '_';
        const sepPattern = new RegExp(escapeRegExp(sep) + '+', 'g');
        const trimPattern = new RegExp('^' + escapeRegExp(sep) + '|' + escapeRegExp(sep) + '$', 'g');

        return String(title || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/['’]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, sep)
            .replace(sepPattern, sep)
            .replace(trimPattern, '');
    }

    function getStrings() {
        const lang = window.LANG && LANG.plugins && LANG.plugins.newpagefill ? LANG.plugins.newpagefill : {};
        return {
            title: lang.dialog_title || 'Creer une nouvelle page',
            pageTitle: lang.dialog_page_title || 'Titre',
            pageId: lang.dialog_page_id || 'Identifiant',
            namespace: lang.dialog_namespace || 'Namespace',
            pageMode: lang.dialog_page_mode || 'Type de creation',
            pageModeStart: lang.dialog_page_mode_start || 'Page de demarrage',
            pageModeNone: lang.dialog_page_mode_none || 'Page directe',
            pageModeSame: lang.dialog_page_mode_same || 'Sous-page du meme nom',
            create: lang.dialog_create || 'Creer',
            cancel: lang.dialog_cancel || 'Annuler',
            required: lang.dialog_required || 'L identifiant est requis.'
        };
    }

    function getPluginConfig() {
        return window.JSINFO && JSINFO.plugins && JSINFO.plugins.newpagefill
            ? JSINFO.plugins.newpagefill
            : {};
    }

    function renderDialogTitle(titleEl, baseTitle, namespace) {
        const cleanedTitle = String(baseTitle || '').trim() || 'Creer une nouvelle page';
        const cleanedNamespace = String(namespace || '').trim().replace(/^:+|:+$/g, '');

        titleEl.textContent = '';
        titleEl.appendChild(document.createTextNode(cleanedTitle));
        if (!cleanedNamespace) return;

        titleEl.appendChild(document.createTextNode(' dans « '));
        cleanedNamespace.split(':').forEach(function (part, index, allParts) {
            const span = document.createElement('span');
            span.textContent = part;
            titleEl.appendChild(span);

            if (index < allParts.length - 1) {
                titleEl.appendChild(document.createTextNode(' > '));
            }
        });
        titleEl.appendChild(document.createTextNode(' »'));
    }

    function buildPageHref(pageId, config) {
        const cleanedPageId = String(pageId || '').trim().replace(/^:+|:+$/g, '');
        if (!cleanedPageId) return '';

        if (Number(config.userewrite) === 1) {
            const root = typeof DOKU_BASE !== 'undefined' && DOKU_BASE ? DOKU_BASE : '/';
            return root.replace(/\/$/, '') + '/' + cleanedPageId.split(':').map(encodeURIComponent).join('/');
        }

        return buildBaseHref('', config) + (buildBaseHref('', config).indexOf('?') >= 0 ? '&' : '?') + 'id=' + encodeURIComponent(cleanedPageId);
    }

    function buildCreationTarget(namespace, pageId, startOption, config, shouldAskStartMode) {
        const cleanedNamespace = String(namespace || '').trim();
        const cleanedPageId = String(pageId || '').trim();
        if (!cleanedPageId) {
            return {pageId: '', href: ''};
        }

        const effectiveStartOption = shouldAskStartMode ? startOption : config.start;
        const startSegment = resolveStartSegment(cleanedPageId, effectiveStartOption, config.defaultStart, config.defaultStartMode);
        const targetPageId = buildTargetPageId(cleanedNamespace, cleanedPageId, startSegment);
        let href;

        if (Number(config.userewrite) === 1) {
            const baseHref = buildBaseHref(cleanedNamespace, config);
            href = baseHref + '/' + encodeURIComponent(cleanedPageId);
            if (startSegment) {
                href += '/' + encodeURIComponent(startSegment);
            }
        } else {
            href = buildBaseHref('', config);
            href = appendToUrl(href, 'id=' + encodeURIComponent(targetPageId));
        }

        return {pageId: targetPageId, href};
    }

    function resolveSubpageNamespace(currentPageId, startPageName) {
        const cleanedId = String(currentPageId || '').trim().replace(/^:+|:+$/g, '');
        const cleanedStart = String(startPageName || '').trim().replace(/^:+|:+$/g, '');
        if (!cleanedId) return '';
        if (!cleanedStart) return cleanedId;

        const parts = cleanedId.split(':');
        if (parts[parts.length - 1] !== cleanedStart) {
            return cleanedId;
        }

        parts.pop();
        return parts.join(':');
    }

    function maybeOpenSubpageDialogFromUrl() {
        const pluginConfig = getPluginConfig();
        if (!pluginConfig.show_subpage_button_in_page_menu) return;
        if (!pluginConfig.subpage_action_enabled) return;
        if (typeof window.URLSearchParams === 'undefined') return;

        const params = new URLSearchParams(window.location.search || '');
        const shouldOpenFromLegacyParam = params.get('newpagefill') === 'subpage';
        const shouldOpenFromAction = params.get('do') === 'newpagefill_subpage';
        if (!shouldOpenFromLegacyParam && !shouldOpenFromAction) return;
        if (!(window.JSINFO && JSINFO.id)) return;

        params.delete('newpagefill');
        if (shouldOpenFromAction) {
            params.delete('do');
        }
        const query = params.toString();
        const nextUrl = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
        if (window.history && typeof window.history.replaceState === 'function') {
            window.history.replaceState({}, document.title, nextUrl);
        }

        window.setTimeout(function () {
            openCreatePageDialog({
                namespace: resolveSubpageNamespace(JSINFO.id, pluginConfig.start),
                initialTitle: '',
            });
        }, 0);
    }

    function appendToUrl(base, params) {
        return base + (base.indexOf('?') >= 0 ? '&' : '?') + params;
    }

    function buildBaseHref(namespace, options) {
        const root = typeof DOKU_BASE !== 'undefined' && DOKU_BASE ? DOKU_BASE : '/';
        const cleaned = String(namespace || '').trim().replace(/^:+|:+$/g, '');

        if (options && Number(options.userewrite) === 1) {
            if (!cleaned) return root.replace(/\/$/, '');
            return root.replace(/\/$/, '') + '/' + cleaned.split(':').map(encodeURIComponent).join('/');
        }

        const base = root.replace(/\/$/, '/');
        if (!cleaned) return base;
        return appendToUrl(base, 'id=' + encodeURIComponent(cleaned));
    }

    function buildTargetPageId(namespace, pageId, start) {
        const parts = [];
        const cleanedNamespace = String(namespace || '').trim().replace(/^:+|:+$/g, '');
        const cleanedPageId = String(pageId || '').trim().replace(/^:+|:+$/g, '');
        const cleanedStart = String(start || '').trim().replace(/^:+|:+$/g, '');

        if (cleanedNamespace) parts.push(cleanedNamespace);
        if (cleanedPageId) parts.push(cleanedPageId);
        if (cleanedStart) parts.push(cleanedStart);

        return parts.join(':');
    }

    function resolveStartSegment(pageId, startOption, defaultStart, defaultMode) {
        if (startOption === null || typeof startOption === 'undefined') {
            startOption = defaultMode;
        }

        if (String(startOption).toLowerCase() === '@ask@' || String(startOption).toLowerCase() === 'ask') {
            return null;
        }

        if (startOption === true) {
            return String(defaultStart || '').trim();
        }

        if (startOption === false || startOption === '' || String(startOption).toLowerCase() === 'none') {
            return '';
        }

        if (String(startOption).toLowerCase() === '@same@' || String(startOption).toLowerCase() === 'same') {
            return String(pageId || '').trim();
        }

        if (String(startOption).toLowerCase() === 'start') {
            return String(defaultStart || '').trim();
        }

        return String(startOption).trim();
    }

    function getDialog() {
        let overlay = document.getElementById('newpagefill_overlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'newpagefill_overlay';
        overlay.innerHTML = [
            '<div class="newpagefill_dialog" role="dialog" aria-modal="true" aria-labelledby="newpagefill_title">',
            '  <h3 id="newpagefill_title"></h3>',
            '  <label class="newpagefill_label" for="newpagefill_input_title"></label>',
            '  <input id="newpagefill_input_title" type="text" autocomplete="off">',
            '  <label class="newpagefill_label" for="newpagefill_input_id"></label>',
            '  <input id="newpagefill_input_id" type="text" autocomplete="off" autocapitalize="off" spellcheck="false">',
            '  <div class="newpagefill_namespace_row">',
            '    <label class="newpagefill_label" for="newpagefill_input_namespace"></label>',
            '    <input id="newpagefill_input_namespace" type="text" autocomplete="off" autocapitalize="off" spellcheck="false">',
            '  </div>',
            '  <div class="newpagefill_mode_row">',
            '    <label class="newpagefill_label" for="newpagefill_input_mode"></label>',
            '    <select id="newpagefill_input_mode"></select>',
            '  </div>',
            '  <p class="newpagefill_error" aria-live="polite"></p>',
            '  <p class="newpagefill_target"><span class="newpagefill_target_label"></span> <span class="newpagefill_target_value"></span></p>',
            '  <div class="newpagefill_actions">',
            '    <button type="button" class="newpagefill_cancel"></button>',
            '    <button type="button" class="newpagefill_create"></button>',
            '  </div>',
            '</div>'
        ].join('');
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                overlay.classList.remove('is-open');
            }
        });

        return overlay;
    }

    function openCreatePageDialog(options) {
        const overlay = getDialog();
        const strings = getStrings();
        const titleEl = overlay.querySelector('#newpagefill_title');
        const titleLabel = overlay.querySelector('label[for="newpagefill_input_title"]');
        const namespaceRow = overlay.querySelector('.newpagefill_namespace_row');
        const namespaceLabel = overlay.querySelector('label[for="newpagefill_input_namespace"]');
        const modeRow = overlay.querySelector('.newpagefill_mode_row');
        const modeLabel = overlay.querySelector('label[for="newpagefill_input_mode"]');
        const idLabel = overlay.querySelector('label[for="newpagefill_input_id"]');
        const titleInput = overlay.querySelector('#newpagefill_input_title');
        const namespaceInput = overlay.querySelector('#newpagefill_input_namespace');
        const modeInput = overlay.querySelector('#newpagefill_input_mode');
        const idInput = overlay.querySelector('#newpagefill_input_id');
        const errorEl = overlay.querySelector('.newpagefill_error');
        const targetEl = overlay.querySelector('.newpagefill_target');
        const targetLabelEl = overlay.querySelector('.newpagefill_target_label');
        const targetValueEl = overlay.querySelector('.newpagefill_target_value');
        const cancelBtn = overlay.querySelector('.newpagefill_cancel');
        const createBtn = overlay.querySelector('.newpagefill_create');
        const pluginConfig = getPluginConfig();
        const config = {
            namespace: options && options.namespace ? options.namespace : '',
            sepchar: options && options.sepchar ? options.sepchar : (pluginConfig.sepchar || '_'),
            start: options && Object.prototype.hasOwnProperty.call(options, 'start')
                ? options.start
                : undefined,
            defaultStart: pluginConfig.start || 'start',
            defaultStartMode: pluginConfig.default_start_mode || 'start',
            initialTitle: options && options.initialTitle ? options.initialTitle : '',
            userewrite: options && typeof options.userewrite !== 'undefined'
                ? options.userewrite
                : pluginConfig.userewrite
        };

        renderDialogTitle(titleEl, strings.title, config.namespace);
        titleLabel.textContent = strings.pageTitle;
        namespaceLabel.textContent = strings.namespace;
        modeLabel.textContent = strings.pageMode;
        idLabel.textContent = strings.pageId;
        targetLabelEl.textContent = strings.targetPreview || 'Page cible :';
        cancelBtn.textContent = strings.cancel;
        createBtn.textContent = strings.create;
        errorEl.textContent = '';
        namespaceRow.style.display = config.namespace ? 'none' : '';
        const shouldAskStartMode =
            String(config.start).toLowerCase() === '@ask@' ||
            String(config.start).toLowerCase() === 'ask' ||
            ((typeof config.start === 'undefined' || config.start === null) && config.defaultStartMode === 'ask');

        modeRow.style.display = shouldAskStartMode ? '' : 'none';
        modeInput.innerHTML = '';
        [
            {value: 'start', label: strings.pageModeStart},
            {value: 'none', label: strings.pageModeNone},
            {value: '@same@', label: strings.pageModeSame}
        ].forEach(function (option) {
            const el = document.createElement('option');
            el.value = option.value;
            el.textContent = option.label;
            modeInput.appendChild(el);
        });

        let idDirty = false;

        function updateSuggestedId() {
            if (idDirty) return;
            idInput.value = slugifyTitle(titleInput.value, config);
        }

        function updateTargetPreview() {
            const namespaceValue = (namespaceRow.style.display === 'none' ? config.namespace : namespaceInput.value).trim();
            const pageIdValue = idInput.value.trim();
            const target = buildCreationTarget(namespaceValue, pageIdValue, modeInput.value, config, shouldAskStartMode);

            renderDialogTitle(titleEl, strings.title, namespaceValue || config.namespace);

            if (!target.pageId || !target.href) {
                targetEl.style.display = 'none';
                targetValueEl.textContent = '';
                return;
            }

            targetValueEl.textContent = '';
            const link = document.createElement('a');
            link.href = buildPageHref(target.pageId, config);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            const normalizedNamespace = namespaceValue.replace(/^:+|:+$/g, '');
            const highlightedSuffix = normalizedNamespace && target.pageId.indexOf(normalizedNamespace + ':') === 0
                ? target.pageId.slice(normalizedNamespace.length + 1)
                : target.pageId;

            if (normalizedNamespace && highlightedSuffix !== target.pageId) {
                link.appendChild(document.createTextNode(normalizedNamespace + ':'));
            }

            const suffixSpan = document.createElement('span');
            suffixSpan.className = 'newpagefill_target_current';
            suffixSpan.textContent = highlightedSuffix;
            link.appendChild(suffixSpan);
            targetValueEl.appendChild(link);
            targetEl.style.display = '';
        }

        function closeDialog() {
            overlay.classList.remove('is-open');
            document.removeEventListener('keydown', handleKeydown);
        }

        function submitDialog() {
            const titleValue = titleInput.value.trim();
            const namespaceValue = namespaceInput.value.trim();
            const idValue = idInput.value.trim();
            if (!idValue) {
                errorEl.textContent = strings.required;
                idInput.focus();
                return;
            }

            const namespace = namespaceValue || config.namespace;
            const target = buildCreationTarget(namespace, idValue, modeInput.value, config, shouldAskStartMode);
            let targetUrl = target.href;

            targetUrl = appendToUrl(targetUrl, 'do=edit');
            if (titleValue) {
                targetUrl = appendToUrl(targetUrl, 'title=' + encodeURIComponent(titleValue));
            }

            window.location.href = targetUrl;
        }

        function handleKeydown(event) {
            if (!overlay.classList.contains('is-open')) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeDialog();
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                submitDialog();
            }
        }

        titleInput.value = config.initialTitle;
        namespaceInput.value = config.namespace;
        idInput.value = '';
        idDirty = false;
        updateSuggestedId();
        updateTargetPreview();

        titleInput.oninput = function () {
            errorEl.textContent = '';
            updateSuggestedId();
            updateTargetPreview();
        };

        idInput.oninput = function () {
            errorEl.textContent = '';
            idDirty = idInput.value.trim() !== slugifyTitle(titleInput.value, config);
            updateTargetPreview();
        };

        namespaceInput.oninput = function () {
            errorEl.textContent = '';
            updateTargetPreview();
        };

        modeInput.onchange = function () {
            errorEl.textContent = '';
            updateTargetPreview();
        };

        cancelBtn.onclick = closeDialog;
        createBtn.onclick = submitDialog;

        overlay.classList.add('is-open');
        document.addEventListener('keydown', handleKeydown);
        window.setTimeout(() => titleInput.focus(), 0);
    }

    window.NewPageFill = {
        slugifyTitle,
        openCreatePageDialog
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', maybeOpenSubpageDialogFromUrl, {once: true});
    } else {
        maybeOpenSubpageDialogFromUrl();
    }
})();
