import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import { join } from "path";
import fs from "fs";
import { dbService } from "./database/db.service";

app.whenReady().then(async () => {
  try {
    await dbService.applyMigrations();
    await dbService.runSeeds();

    createWindow();

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["script-src 'self'"],
        },
      });
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    app.quit();
  }
});

ipcMain.handle("database:query", (_, sql, params) => {
  const stmt = dbService.db.prepare(sql);
  return params ? stmt.all(params) : stmt.all();
});

ipcMain.handle("database:execute", (_, sql, params) => {
  try {
    const stmt = dbService.db.prepare(sql);
    const result = params ? stmt.run(params) : stmt.run();

    return {
      success: true,
      lastId: result.lastInsertRowid,
      changes: result.changes,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("database:reset", async () => {
  const dbFile = join(app.getPath("userData"), "app-database.sqlite");

  try {
    if (dbService.db) {
      dbService.db.close();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    let retries = 5;
    while (retries-- > 0) {
      try {
        if (fs.existsSync(dbFile)) {
          fs.unlinkSync(dbFile);
        }
        break;
      } catch (err: any) {
        if (err.code === 'EBUSY' && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
        throw err;
      }
    }

    dbService.initializeDatabase();
    await dbService.applyMigrations();
    await dbService.runSeeds();
    
    return { success: true };
  } catch (error: any) {
    console.error("Reset database failed:", error);
    return { 
      success: false,
      error: error.message,
      code: error.code
    };
  }
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      devTools: true,
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === "development") {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  } else {
    mainWindow.loadFile(join(app.getAppPath(), "renderer", "index.html"));
  }
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  const { filePath } = await dialog.showSaveDialog({
    title: options.title || "Save File",
    defaultPath:
      options.defaultPath ||
      join(app.getPath("downloads"), options.defaultFileName || "export.json"),
    filters: options.filters || [
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["createDirectory"],
  });
  return filePath;
});

ipcMain.handle("export-file", async (event, { filePath, data }) => {
  try {
    const serializableData = JSON.parse(JSON.stringify(data));
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(serializableData, null, 2),
      "utf8"
    );
    return { success: true, path: filePath };
  } catch (err: any) {
    console.error("Error writing file", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("export-database", async () => {
  try {
    const srcDb = join(app.getPath("userData"), "app-database.sqlite");

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export Database",
      buttonLabel: "Export",
      defaultPath: join(app.getPath("documents"), "database_backup.sqlite"),
      filters: [
        { name: "SQLite Database", extensions: ["sqlite", "db"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: [
        "createDirectory",
        "showOverwriteConfirmation",
        "dontAddToRecent",
      ],
    });

    if (canceled || !filePath) {
      return { success: false, error: "Export cancelled" };
    }

    if (dbService.db.open) {
      dbService.db.close();
    }

    await fs.promises.copyFile(srcDb, filePath);

    await dbService.initializeDatabase();

    const { size } = await fs.promises.stat(filePath);

    return { success: true, path: filePath, size };
  } catch (err: any) {
    console.error("Export DB failed:", err);
    return { success: false, error: err.message, code: err.code };
  }
});

ipcMain.handle("export-sql-query", async () => {
  try {
    const tables = ["companies", "users"];
    let sqlContent = "BEGIN TRANSACTION;\n\n";

    for (const table of tables) {
      const data = dbService.db.prepare(`SELECT * FROM ${table}`).all();
      if (data.length === 0) continue;

      const schema = dbService.db.prepare(`PRAGMA table_info(${table})`).all();
      const primaryKey = schema.find((col) => col.pk === 1)?.name || "id";
      const columns = Object.keys(data[0]);

      // Tạo mảng giá trị cho multi-row insert
      const valuesBatch = data.map((row) =>
        columns.map((col) => {
          const value = row[col];
          if (value === null) return "NULL";
          if (typeof value === "string")
            return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString()}'`;
          return value;
        })
      );

      // Tạo mệnh đề UPDATE từ schema
      const updateSet = columns
        .filter((col) => col !== primaryKey)
        .map((col) => `${col} = excluded.${col}`)
        .join(",\n    ");

      sqlContent += `-- UPSERT for ${table}
INSERT INTO ${table} (${columns.join(", ")})
VALUES\n  `;

      // Thêm các giá trị theo batch
      sqlContent += valuesBatch
        .map((values) => `(${values.join(", ")})`)
        .join(",\n  ");

      sqlContent += `\nON CONFLICT(${primaryKey}) DO UPDATE SET
    ${updateSet};\n\n`;
    }

    sqlContent += "COMMIT;";

    // Phần dialog và write file giữ nguyên
    const { filePath } = await dialog.showSaveDialog({
      title: "Export SQL Query",
      filters: [{ name: "SQL Files", extensions: ["sql"] }],
      defaultPath: `database_upsert_${new Date()
        .toISOString()
        .slice(0, 10)}.sql`,
    });

    if (!filePath) return { success: false, error: "Export cancelled" };

    await fs.promises.writeFile(filePath, sqlContent);
    return { success: true, path: filePath };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
});

ipcMain.handle("import:json", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Import from JSON",
    filters: [{ name: "JSON Files", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0)
    return { success: false, error: "No file selected" };

  try {
    const content = await fs.promises.readFile(filePaths[0], "utf8");
    const data = JSON.parse(content);
    const txn = dbService.db.transaction(() => {
      if (data.companies) {
        const upsertV = dbService.db.prepare(`
          INSERT INTO companies (id, name, type, capacity, owner)
          VALUES (@id, @name, @type, @capacity, @owner)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, type=excluded.type,
            capacity=excluded.capacity, owner=excluded.owner
        `);
        data.companies.forEach((v: any) => upsertV.run(v));
      }
      if (data.users) {
        const upsertU = dbService.db.prepare(`
          INSERT INTO users (id, name, email, age, company_id)
          VALUES (@id, @name, @email, @age, @company_id)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, email=excluded.email,
            age=excluded.age, company_id=excluded.company_id
        `);
        data.users.forEach((u: any) => upsertU.run(u));
      }
    });
    txn();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("import:database", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Import SQLite Database",
    filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0)
    return { success: false, error: "No file selected" };

  const src = filePaths[0];
  const dest = join(app.getPath("userData"), "app-database.sqlite");

  try {
    if (dbService.db.open) {
      dbService.db.close();
    }

    await fs.promises.copyFile(src, dest);
    await dbService.initializeDatabase();

    return { success: true };
  } catch (err: any) {
    console.error("Import DB failed:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("import:sql", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Import from SQL File",
    filters: [{ name: "SQL Files", extensions: ["sql"] }],
    properties: ["openFile"],
  });
  if (canceled || filePaths.length === 0)
    return { success: false, error: "No file selected" };

  try {
    const sql = await fs.promises.readFile(filePaths[0], "utf8");
    dbService.db.exec(sql);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});
