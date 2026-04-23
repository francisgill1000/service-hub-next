let allLeads = [];
let currentPage = 1;
const rowsPerPage = 15; // Increased slightly for better table view

// --- Event Listeners for Real-Time Search & Filter ---
document.getElementById('search-input').addEventListener('input', () => {
    currentPage = 1; // Always reset to page 1 when searching
    renderTable();
});

document.getElementById('filter-select').addEventListener('change', () => {
    currentPage = 1; // Reset to page 1 when filter changes
    renderTable();
});

// --- WhatsApp Action ---
window.sendWA = (phone, name, id) => {
    const msg = `Hi ${name}, I saw your salon and wanted to reach out from Rezzy!`;
    window.api.openWA({ phone, message: msg, leadId: id });
    // Small delay to let the IPC message clear before refreshing UI
    setTimeout(refresh, 1000);
};

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
            alert(`✅ Success! Added ${count} new leads.`);
        } else if (count === 0) {
            alert(`ℹ️ No new leads found. All contacts were already in the list.`);
        }
    } catch (err) {
        alert("❌ Error: Could not read CSV. Please check the file format.");
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
        list.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400 italic font-medium">No leads match your search criteria.</td></tr>`;
    }

    // 4. Generate Rows
    pageLeads.forEach((l, index) => {
        const absoluteSerial = start + index + 1; // Correct Serial across pages
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors group";

        tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-black text-slate-200 group-hover:text-blue-300 transition-colors">#${absoluteSerial}</td>
            <td class="px-6 py-4">
                <div class="text-sm font-bold text-slate-900">${l.name}</div>
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">${l.area}</div>
            </td>
            <td class="px-6 py-4">
                <span class="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">+${l.phone}</span>
            </td>
            <td class="px-6 py-4">
                <select onchange="window.updateLeadStatus(${l.id}, this.value)" 
                    class="bg-white border border-slate-200 text-[10px] font-black rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer uppercase transition-all">
                    <option value="new" ${l.status === 'new' ? 'selected' : ''}>NEW</option>
                    <option value="sent" ${l.status === 'sent' ? 'selected' : ''}>SENT</option>
                    <option value="interested" ${l.status === 'interested' ? 'selected' : ''}>INTERESTED</option>
                    <option value="invalid" ${l.status === 'invalid' ? 'selected' : ''}>INVALID</option>
                    <option value="ignore" ${l.status === 'ignore' ? 'selected' : ''}>IGNORE</option>
                </select>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="window.sendWA('${l.phone}', '${l.name.replace(/'/g, "")}', ${l.id})" 
                    class="inline-flex items-center justify-center w-9 h-9 bg-[#25D366] hover:bg-[#128C7E] rounded-full text-white transition-all active:scale-90 shadow-md shadow-green-100">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" class="w-4 h-4 invert">
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