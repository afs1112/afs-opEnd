export function up(db) {
    db.exec(`
        ALTER TABLE users 
        ADD COLUMN age INTEGER NOT NULL DEFAULT 18
      `);
  }
  
  export function down(db) {
    db.exec(`
        CREATE TABLE new_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        );
    
        INSERT INTO new_users (id, company_id, name, email)
        SELECT id, company_id, name, email FROM users;
    
        DROP TABLE users;
        
        ALTER TABLE new_users RENAME TO users;
      `);
  }