export function up(db) {
  db.exec(`
    CREATE TABLE companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      capacity INTEGER,
      owner TEXT
    );

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT UNIQUE
    );
  `);
}

export function down(db) {
  db.exec(`
    DROP TABLE users;
    DROP TABLE companies;
  `);
}
