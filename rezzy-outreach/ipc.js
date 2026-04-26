const { ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const { db } = require('./db');

function cleanName(raw) {
    return String(raw || '')
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizePhone(raw) {
    let phone = String(raw || '').replace(/\D/g, '');
    if (!phone) return '';
    if (phone.startsWith('05')) phone = '971' + phone.substring(1);
    else if (phone.startsWith('5')) phone = '971' + phone;
    return phone;
}

function parseCsvRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const ch = row[i];

        if (inQuotes) {
            if (ch === '"') {
                if (row[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = false; }
            } else {
                current += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

ipcMain.handle('leads:list', (event, filter) => {
    return db.prepare('SELECT * FROM leads ORDER BY id DESC').all();
});

ipcMain.handle('leads:total-count', () => {
    return db.prepare("SELECT COUNT(*) as count FROM leads").get() || {count: 0};
});

ipcMain.handle('leads:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'CSV', extensions: ['csv'] }]
    });

    if (canceled || filePaths.length === 0) return 0;

    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const rows = content.split(/\r?\n/);
    let imported = 0;

    const insert = db.prepare(
        "INSERT OR IGNORE INTO leads (name, area, phone, address, map_url, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
    );

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        const cols = parseCsvRow(row);
        if (cols.length < 4) continue;

        const name = cleanName(cols[1]);
        const area = cols[2];
        const phone = normalizePhone(cols[3]);
        const address = (cols[4] || '').trim() || null;
        const rawMap = (cols[5] || '').trim();
        const mapUrl = /^https?:\/\//i.test(rawMap) ? rawMap : null;

        if (phone && name) {
            const info = insert.run(name, area, phone, address, mapUrl);
            if (info.changes > 0) imported++;
        }
    }
    return imported;
});

ipcMain.on('leads:open-whatsapp', (event, { phone, message, leadId }) => {
    shell.openExternal(`https://wa.me/${phone}`);
});

ipcMain.handle('leads:update-status', (event, { id, status }) => {
    return db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
});

ipcMain.handle('stats:today', () => {
    return db.prepare("SELECT COUNT(*) as count FROM activity_log WHERE action='marked_sent' AND date(created_at) = date('now', 'localtime')").get() || {count: 0};
});

ipcMain.handle('leads:create', (event, data) => {
    const name = cleanName(data?.name);
    const area = String(data?.area || '').trim();
    const phone = normalizePhone(data?.phone);
    const address = String(data?.address || '').trim() || null;
    const mapUrl = String(data?.mapUrl || '').trim() || null;

    if (!name) return { ok: false, error: 'Name is required' };
    if (!area) return { ok: false, error: 'Area is required' };
    if (!phone) return { ok: false, error: 'Phone is required' };
    if (mapUrl && !/^https?:\/\//i.test(mapUrl)) {
        return { ok: false, error: 'Map URL must start with http:// or https://' };
    }

    try {
        const info = db.prepare(
            "INSERT INTO leads (name, area, phone, address, map_url, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))"
        ).run(name, area, phone, address, mapUrl);
        return { ok: true, id: info.lastInsertRowid };
    } catch (e) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return { ok: false, error: 'A lead with this phone number already exists' };
        }
        return { ok: false, error: e.message };
    }
});

ipcMain.handle('app:open-url', (event, url) => {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false;
    shell.openExternal(url);
    return true;
});

ipcMain.handle('template:get', () => {
    const row = db.prepare("SELECT body FROM templates WHERE language='en' AND kind='first'").get();
    return row?.body || '';
});

ipcMain.handle('template:save', (event, body) => {
    const text = String(body || '').trim();
    if (!text) return { ok: false, error: 'Template cannot be empty' };
    db.prepare(
        "INSERT INTO templates (language, kind, body) VALUES ('en', 'first', ?) ON CONFLICT(language, kind) DO UPDATE SET body = excluded.body"
    ).run(text);
    return { ok: true };
});

ipcMain.handle('leads:download-sample', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Save sample CSV',
        defaultPath: 'rezzy-leads-sample.csv',
        filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (canceled || !filePath) return false;

    const sample =
        '#,name,area,phone,address,map_url\n' +
        '1,AL BAHAR AL HADI Ladies Salon,Al Nahda,0501234567,"Building 12, King Faisal Road",https://maps.google.com/?q=25.331,55.495\n' +
        '2,Glow Beauty Studio,Al Qasimia,971501112222,,\n' +
        '3,"Smith, Jane Salon",Bur Dubai,5559876543,Cluster J Lake Tower,https://goo.gl/maps/example\n';

    fs.writeFileSync(filePath, sample, 'utf-8');
    return true;
});