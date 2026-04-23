const { ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const { db } = require('./db');

ipcMain.handle('leads:list', (event, filter) => {
    return db.prepare('SELECT * FROM leads ORDER BY id ASC').all();
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

    const insert = db.prepare('INSERT OR IGNORE INTO leads (name, area, phone) VALUES (?, ?, ?)');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        // Smart Split: Handles commas inside quotes
        const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!cols || cols.length < 4) continue;

        const name = cols[1]?.replace(/"/g, '').trim();
        const area = cols[2]?.replace(/"/g, '').trim();
        let phone = cols[3]?.replace(/\D/g, '');

        if (phone && name) {
            if (phone.startsWith('05')) phone = '971' + phone.substring(1);
            else if (phone.startsWith('5')) phone = '971' + phone;

            const info = insert.run(name, area, phone);
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