let allLeads = [];
let currentPage = 1;
const rowsPerPage = 15; // Increased slightly for better table view

const WA_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>`;

// --- Notifications (SweetAlert2, theme-matched) ---
function toast(icon, title) {
    return Swal.fire({
        toast: true,
        position: 'top-end',
        icon,
        title,
        showConfirmButton: false,
        timer: 2400,
        timerProgressBar: true,
        customClass: { popup: 'rezzy-toast' },
    });
}

function notifyModal(icon, title, text) {
    return Swal.fire({
        icon,
        title,
        text,
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: { popup: 'rezzy-swal' },
    });
}

// --- Theme Toggle ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
});

// --- Custom Dropdown (portal-rendered) ---
let activeMenu = null;

function closeMenu() {
    if (activeMenu) {
        activeMenu.remove();
        activeMenu = null;
    }
}

function openDropdown(triggerEl, items, currentValue, onSelect) {
    if (activeMenu && activeMenu._trigger === triggerEl) {
        closeMenu();
        return;
    }
    closeMenu();

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu._trigger = triggerEl;

    const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="check w-3.5 h-3.5"><path fill-rule="evenodd" d="M16.704 5.296a1 1 0 010 1.408l-7.997 8a1 1 0 01-1.414 0l-3.997-4a1 1 0 011.414-1.408L8 12.582l7.29-7.286a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`;

    items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dropdown-item' + (item.value === currentValue ? ' is-selected' : '');
        btn.innerHTML = `<span>${item.label}</span>${checkSvg}`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelect(item.value);
            closeMenu();
        });
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    // Position after append so we know menu height
    const rect = triggerEl.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuRect.height + 12 && rect.top > menuRect.height + 12;

    menu.style.left = `${rect.left}px`;
    menu.style.minWidth = `${rect.width}px`;
    menu.style.top = showAbove
        ? `${rect.top - menuRect.height - 4}px`
        : `${rect.bottom + 4}px`;

    activeMenu = menu;
}

document.addEventListener('click', (e) => {
    if (activeMenu && !activeMenu.contains(e.target) && !e.target.closest('[data-dropdown-trigger]')) {
        closeMenu();
    }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
document.addEventListener('scroll', closeMenu, true);
window.addEventListener('resize', closeMenu);

// --- Header filter dropdown ---
const FILTER_ITEMS = [
    { value: 'all', label: 'ALL STATUSES' },
    { value: 'new', label: 'NEW' },
    { value: 'sent', label: 'SENT' },
    { value: 'interested', label: 'INTERESTED' },
    { value: 'invalid', label: 'INVALID' },
    { value: 'ignore', label: 'IGNORE' },
];

document.getElementById('filter-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    const trigger = e.currentTarget;
    const select = document.getElementById('filter-select');
    openDropdown(trigger, FILTER_ITEMS, select.value, (val) => {
        select.value = val;
        document.getElementById('filter-label').textContent =
            FILTER_ITEMS.find(i => i.value === val).label;
        select.dispatchEvent(new Event('change'));
    });
});

// --- Per-row status dropdown ---
const STATUS_ITEMS = [
    { value: 'new', label: 'NEW' },
    { value: 'sent', label: 'SENT' },
    { value: 'interested', label: 'INTERESTED' },
    { value: 'invalid', label: 'INVALID' },
    { value: 'ignore', label: 'IGNORE' },
];

window.openStatusDropdown = (trigger, id, current) => {
    openDropdown(trigger, STATUS_ITEMS, current, (val) => window.updateLeadStatus(id, val));
};

// --- Lead Side Panel ---
const panel = document.getElementById('lead-panel');
const backdrop = document.getElementById('panel-backdrop');
const leadForm = document.getElementById('lead-form');
const formError = document.getElementById('form-error');
const saveBtn = document.getElementById('panel-save');

function openPanel(mode = 'create', prefill = null) {
    panel.dataset.mode = mode;
    document.getElementById('panel-title').textContent =
        mode === 'edit' ? 'Edit Lead' : 'Add New Lead';
    leadForm.reset();
    formError.classList.add('hidden');
    formError.textContent = '';
    if (prefill) {
        for (const [key, val] of Object.entries(prefill)) {
            const field = leadForm.elements[key];
            if (field) field.value = val ?? '';
        }
    }
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    panel.classList.remove('translate-x-full');
    setTimeout(() => leadForm.elements.name.focus(), 220);
}

function closePanel() {
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    panel.classList.add('translate-x-full');
}

document.getElementById('add-lead-btn').addEventListener('click', () => openPanel('create'));
document.getElementById('panel-close').addEventListener('click', closePanel);
document.getElementById('panel-cancel').addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.classList.contains('translate-x-full')) closePanel();
});

leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('hidden');

    const data = Object.fromEntries(new FormData(leadForm).entries());
    saveBtn.disabled = true;
    saveBtn.textContent = 'SAVING...';

    try {
        const result = await window.api.createLead(data);
        if (result?.ok) {
            closePanel();
            await refresh();
        } else {
            formError.textContent = result?.error || 'Could not save lead.';
            formError.classList.remove('hidden');
        }
    } catch (err) {
        formError.textContent = err.message || 'Unexpected error.';
        formError.classList.remove('hidden');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'SAVE LEAD';
    }
});

window.openMap = (url) => window.api.openUrl(url);

function mapsLinkFor(lead) {
    if (lead.map_url && /^https?:\/\//i.test(lead.map_url)) return lead.map_url;
    const parts = [lead.name, lead.area, 'Sharjah', 'UAE'].filter(Boolean);
    if (!parts.length) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
}

document.getElementById('sample-csv-btn').addEventListener('click', async () => {
    try {
        const ok = await window.api.downloadSampleCsv();
        if (ok) toast('success', 'Sample CSV saved');
    } catch (err) {
        notifyModal('error', 'Could not save', err.message || 'Unexpected error.');
    }
});

// --- Date formatters ---
function parseSqliteDate(s) {
    // SQLite stores "YYYY-MM-DD HH:MM:SS"; convert to ISO for reliable parsing
    return s ? new Date(s.replace(' ', 'T')) : null;
}

function formatRelative(s) {
    const d = parseSqliteDate(s);
    if (!d || isNaN(d)) return '—';
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 45) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    if (day < 30) return `${Math.floor(day / 7)}w ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatAbsolute(s) {
    const d = parseSqliteDate(s);
    if (!d || isNaN(d)) return '';
    return d.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// --- Event Listeners for Real-Time Search & Filter ---
document.getElementById('search-input').addEventListener('input', () => {
    currentPage = 1; // Always reset to page 1 when searching
    renderTable();
});

document.getElementById('filter-select').addEventListener('change', () => {
    currentPage = 1; // Reset to page 1 when filter changes
    renderTable();
});

// --- WhatsApp Template + Send ---
const DEFAULT_TEMPLATE = 'Hi {name}, I saw your salon in {area} and wanted to reach out from Rezzy!';

function fillTemplate(tpl, lead) {
    return String(tpl || '')
        .replace(/\{name\}/gi, lead.name || '')
        .replace(/\{shop_name\}/gi, lead.name || '')
        .replace(/\{area\}/gi, lead.area || '')
        .replace(/\{address\}/gi, lead.address || '')
        .replace(/\{phone\}/gi, lead.phone || '');
}

window.sendWA = async (phone, name, id) => {
    const lead = allLeads.find(l => l.id === id) || { name, phone };
    let tpl = '';
    try { tpl = await window.api.getTemplate(); } catch (_) {}
    const message = fillTemplate(tpl || DEFAULT_TEMPLATE, lead);

    let copied = false;
    try {
        await navigator.clipboard.writeText(message);
        copied = true;
    } catch (_) {}

    window.api.openWA({ phone, message, leadId: id });
    toast(copied ? 'success' : 'warning',
        copied ? 'Message copied — paste in WhatsApp' : 'Opened WhatsApp (clipboard blocked)');
    setTimeout(refresh, 1000);
};

document.getElementById('template-btn').addEventListener('click', async () => {
    let current = '';
    try { current = await window.api.getTemplate(); } catch (_) {}
    if (!current) current = DEFAULT_TEMPLATE;

    const result = await Swal.fire({
        title: 'WhatsApp Message Template',
        html: `
            <div class="text-left">
                <textarea id="tpl-body" rows="6"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-mono"
                    placeholder="Hi {name}, ...">${escapeHtml(current)}</textarea>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Placeholders: <code class="font-mono text-blue-600 dark:text-blue-400">{name}</code>
                    <code class="font-mono text-blue-600 dark:text-blue-400">{area}</code>
                    <code class="font-mono text-blue-600 dark:text-blue-400">{address}</code>
                    <code class="font-mono text-blue-600 dark:text-blue-400">{phone}</code>
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        buttonsStyling: false,
        customClass: { popup: 'rezzy-swal' },
        preConfirm: () => {
            const v = document.getElementById('tpl-body').value.trim();
            if (!v) {
                Swal.showValidationMessage('Template cannot be empty');
                return false;
            }
            return v;
        },
    });

    if (result.isConfirmed && result.value) {
        const res = await window.api.saveTemplate(result.value);
        if (res?.ok) toast('success', 'Template saved');
        else notifyModal('error', 'Could not save', res?.error || 'Unknown error');
    }
});

// --- Manual Status Update ---
window.updateLeadStatus = async (id, newStatus) => {
    await window.api.updateStatus({ id, status: newStatus });
    refresh();
};

// --- Fetch Data & Update Header Stats ---
async function refresh() {
    try {
        const stats = await window.api.getTodayCount();
        const total = await window.api.getTotalCount();
        
        // Update Numbers in Header
        const dailyCount = stats.count || 0;
        document.getElementById('count').innerText = dailyCount;
        document.getElementById('total-leads').innerText = `Total: ${total.count || 0}`;

        // Update Progress Bar
        const progressPercent = Math.min((dailyCount / 35) * 100, 100);
        document.getElementById('progress-bar').style.width = `${progressPercent}%`;

        // Fetch all leads for the local search/filter logic
        allLeads = await window.api.getLeads('all');
        renderTable();
    } catch (err) {
        console.error("Refresh failed:", err);
    }
}

// --- Import CSV with Button Feedback ---
document.getElementById('import-btn').onclick = async () => {
    const btn = document.getElementById('import-btn');
    const originalText = btn.innerText;

    btn.disabled = true;
    btn.innerText = "IMPORTING...";
    
    try {
        const count = await window.api.importCSV();
        if (count > 0) {
            toast('success', `Added ${count} new leads`);
        } else if (count === 0) {
            notifyModal('info', 'Nothing to import', 'All contacts in the file were already in your list.');
        }
    } catch (err) {
        notifyModal('error', 'Import failed', 'Could not read the CSV. Please check the file format.');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
        refresh();
    }
};

// --- The Main Render Engine ---
function renderTable() {
    const list = document.getElementById('lead-list');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterStatus = document.getElementById('filter-select').value;
    
    list.innerHTML = '';

    // 1. Filter and Search the data
    const filteredLeads = allLeads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm) || 
                              l.area.toLowerCase().includes(searchTerm) || 
                              l.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // 2. Pagination Math
    const totalPages = Math.ceil(filteredLeads.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageLeads = filteredLeads.slice(start, end);

    // 3. Handle Empty State
    if (pageLeads.length === 0) {
        list.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic font-medium">No leads match your search criteria.</td></tr>`;
    }

    // 4. Generate Rows
    pageLeads.forEach((l, index) => {
        const absoluteSerial = start + index + 1; // Correct Serial across pages
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group";

        const safeName = String(l.name).replace(/'/g, "").replace(/"/g, '&quot;');

        const mapHref = mapsLinkFor(l);
        const safeMapUrl = escapeHtml(mapHref);
        const isCustomMap = !!(l.map_url && /^https?:\/\//i.test(l.map_url));

        tr.innerHTML = `
            <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-700 group-hover:text-blue-300 dark:group-hover:text-blue-500 transition-colors">#${absoluteSerial}</td>
            <td class="px-6 py-4 max-w-xs">
                <div class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title="${escapeHtml(l.name)}">${escapeHtml(l.name)}</div>
                <div class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5 truncate">${escapeHtml(l.area)}</div>
                ${l.address ? `<div class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" title="${escapeHtml(l.address)}">${escapeHtml(l.address)}</div>` : ''}
            </td>
            <td class="px-6 py-4">
                <span class="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">+${l.phone}</span>
            </td>
            <td class="px-6 py-4">
                ${mapHref ? `<button type="button" onclick="window.openMap('${safeMapUrl}')"
                    title="${escapeHtml(l.address || (isCustomMap ? 'Open saved map link' : `Search "${l.name}, ${l.area}" on Google Maps`))}"
                    class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1.5 rounded-md transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd"/></svg>
                    View Map
                </button>` : `<span class="text-xs text-slate-400 dark:text-slate-600">—</span>`}
            </td>
            <td class="px-6 py-4">
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400" title="${formatAbsolute(l.created_at)}">${formatRelative(l.created_at)}</span>
            </td>
            <td class="px-6 py-4">
                <button type="button" data-dropdown-trigger
                    onclick="event.stopPropagation(); window.openStatusDropdown(this, ${l.id}, '${l.status}')"
                    class="inline-flex items-center justify-between gap-2 min-w-[110px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black rounded-lg pl-2.5 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer uppercase transition-colors">
                    <span>${(l.status || 'new').toUpperCase()}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3 text-slate-400 dark:text-slate-500"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
                </button>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="window.sendWA('${l.phone}', '${safeName}', ${l.id})"
                    title="Send WhatsApp to ${safeName}"
                    class="inline-flex items-center justify-center w-9 h-9 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
                    ${WA_ICON_SVG}
                </button>
            </td>
        `;
        list.appendChild(tr);
    });

    // 5. Update Pagination Controls
    document.getElementById('page-info').innerText = `Page ${currentPage} of ${totalPages} (${filteredLeads.length} leads found)`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

// --- Pagination Actions ---
document.getElementById('prev-page').onclick = () => { 
    if (currentPage > 1) { 
        currentPage--; 
        renderTable(); 
    } 
};

document.getElementById('next-page').onclick = () => { 
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterStatus = document.getElementById('filter-select').value;
    
    // Re-calculate length based on current filter for accurate next-page logic
    const filteredLength = allLeads.filter(l => {
        const matchesSearch = l.name.toLowerCase().includes(searchTerm) || l.area.toLowerCase().includes(searchTerm) || l.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
        return matchesSearch && matchesStatus;
    }).length;

    const totalPages = Math.ceil(filteredLength / rowsPerPage);
    if (currentPage < totalPages) { 
        currentPage++; 
        renderTable(); 
    } 
};

// Initial Load
refresh();