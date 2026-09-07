const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:\Users\Amy Uzcategui\Documents\VENTECH\erp-platform/desktop-app/dist/win-unpacked/resources/api/template.db', sqlite3.OPEN_READONLY);
db.get("SELECT email, password FROM User WHERE email = '12832779'", (err, row) => {
    if (err) console.error(err);
    else console.log("USER FOUND:", row);
    db.close();
});
