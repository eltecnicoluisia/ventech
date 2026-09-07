const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const runSql = (dbPath) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
    });

    db.serialize(() => {
      const pwdHash = '$2b$10$fUBAs4dtzJCnZ92MWRqyauRVtDvthy7efk4jjUTkyHOyMy9q7wMeq';
      db.run("UPDATE User SET password = '" + pwdHash + "' WHERE email = '12832779'");
    });

    db.close((err) => {
      if (err) return reject(err);
      console.log('Updated password in: ' + dbPath);
      resolve();
    });
  });
};

const distDb = path.join(__dirname, 'dist', 'win-unpacked', 'resources', 'api', 'template.db');

(async () => {
  try {
    await runSql(distDb);
  } catch(e) {
    console.error(e);
  }
})();
