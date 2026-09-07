const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\\Users\\Amy Uzcategui\\Documents\\VENTECH\\erp-platform\\desktop-app\\resources\\\\api\\\\template.db');
db.serialize(() => {
    db.run("INSERT OR IGNORE INTO Tenant (id, name, rif, isActive, createdAt) VALUES ('default-tenant', 'Ventech Offline', 'J-00000000-0', 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
    const hash = '$2b$10$fUBAs4dtzJCnZ92MWRqyauRVtDvthy7efk4jjUTkyHOyMy9q7wMeq';
    db.run("INSERT OR IGNORE INTO User (id, tenantId, email, password, role, name, isActive, createdAt, updatedAt) VALUES ('b00165f3-bbd6-4b20-b7c8-0f5a9dc2cfd2', 'default-tenant', '12832779', '" + hash + "', 'SUPERADMIN', 'Administrador General', 1, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))");
});
db.close();
