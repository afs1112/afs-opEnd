import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";

class DBService {
  private dbInstance: Database.Database;
  private migrationsPath = path.join(__dirname, "migrations");
  private seedsPath = path.join(__dirname, "seeds");

  constructor() {
    this.initializeDatabase();
    this.applyMigrations();
    this.runSeeds();
  }

  private getDatabasePath() {
    return path.join(app.getPath("userData"), "app-database.sqlite");
  }

  private getAppliedVersions(tableName: string) {
    this.dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        version TEXT PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return this.dbInstance
      .prepare(`SELECT version FROM ${tableName} ORDER BY version DESC`)
      .all()
      .map((row) => row.version);
  }

  private async processFiles(
    dirPath: string,
    tableName: string,
    executor: (filePath: string) => void
  ) {
    const files = fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".js"))
      .sort();

    const applied = this.getAppliedVersions(tableName);

    for (const file of files) {
      const version = file.split("-")[0];
      if (applied.includes(version)) continue;

      const filePath = path.join(dirPath, file);
      await executor(filePath);

      this.dbInstance
        .prepare(`INSERT INTO ${tableName} (version) VALUES (?)`)
        .run(version);
    }
  }

  public initializeDatabase() {
    this.dbInstance = new Database(this.getDatabasePath());
    this.dbInstance.pragma("journal_mode = WAL");
    this.dbInstance.pragma("foreign_keys = ON");
  }

  public async applyMigrations() {
    await this.processFiles(
      this.migrationsPath,
      "schema_migrations",
      async (filePath) => {
        const migration = require(filePath);
        const transaction = this.dbInstance.transaction(() => {
          migration.up(this.dbInstance);
        });
        transaction();
      }
    );
  }

  public async runSeeds() {
    await this.processFiles(this.seedsPath, "data_seeds", async (filePath) => {
      const seed = require(filePath);
      const transaction = this.dbInstance.transaction(() => {
        seed.run(this.dbInstance);
      });
      transaction();
    });
  }

  public get db() {
    return this.dbInstance;
  }
}

export const dbService = new DBService();
