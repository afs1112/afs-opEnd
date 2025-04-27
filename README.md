

# Electron Vue SQLite Starter 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron 28](https://img.shields.io/badge/Electron-28-9FEAF9.svg?logo=electron)](https://www.electronjs.org)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D.svg?logo=vuedotjs)](https://vuejs.org)
[![TypeScript Ready](https://img.shields.io/badge/TypeScript-Ready-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)

**Production-Grade Template for Enterprise Desktop Applications** - Combine the power of Electron ⚡, Vue 3 Composition API 🔥, and SQLite 💾 in a secure, maintainable architecture.

![{7E915174-6BEE-45A4-8E5C-82397882E431}](https://github.com/user-attachments/assets/a7928531-a4bc-4c9b-91df-ff7fc8aa7ebb)


## Why This Template? 💡

A batteries-included solution that solves common Electron-Vue integration challenges:
✅ **Secure IPC Communication** with strict validation  
✅ **Database Migrations** system for schema management  
✅ **Native Module** integration best practices  
✅ **Cross-platform** packaging configuration  
✅ **Modern Vue 3** development experience  
✅ **Type-safe** across entire codebase

## Key Features ✨

### 🛡️ Core Architecture
- Electron 28 + Vue 3 + Vite + TypeScript 
- Strict IPC security with `electron-ipc-controller`
- Pre-configured native module support (SQLite3)
- Multi-environment configuration (dev/prod)

### 💾 Database Layer
- SQLite3 with connection pooling
- Migration system with version control
- Transaction support & prepared statements
- Example CRUD operations with type-safe interfaces

### 🎛️ Production Optimization
- Electron-builder configuration with:
  - Auto-update support
  - Code signing preparation
  - Cross-platform builds (Windows/Mac/Linux)
  - Resource compression (asar)
- Performance monitoring hooks
- Memory leak detection setup

### 🎨 Frontend Features
- Theme system with CSS variables
- Responsive layout components
- Error boundary components
- Customizable plugin architecture
- Dark/light mode with system sync

## Getting Started 🚀

### System Requirements
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Python 3.10+ (for node-gyp compilation)
- Build tools for your OS:
  - **Windows**: Visual Studio Build Tools
  - **Mac**: Xcode Command Line Tools
  - **Linux**: build-essential

### Installation
```bash
# Clone with SSH
git clone git@github.com:NinelXram/electron-vue-sqlite-template.git
cd electron-vue-sqlite-template

# Install dependencies
yarn install

# Start development mode
yarn dev

# Build production packages
yarn build
```
## Architecture Overview 🏗️

electron-vue-sqlite-template/
├── src/
│   ├── main/	# Electron Main Process
│   │   ├── database/	# SQLite3 wrapper
│   │   │   ├── migrations/	# Schema version control
│   │   │   └── seed.ts	# Initial data population
│   │   ├── main.ts	# Main process entry
│   │   └── preload.ts	# Preload script
│   │
│   └── renderer/	# Vue 3 Renderer Process
│       ├── assets/	# Compiled assets
│       ├── components/	# Shared UI components
│       ├── composables/	# Vue composition APIs
│       ├── services/	# Business logic layer
│       ├── types/	# TypeScript definitions
│       └── views/	# Route-based components
│
├── electron-builder.json	# Production packaging config
└── vite.config.ts	# Renderer build config

## Database Operations Example 💾

### 1. Create Migration

```typescript
// src/main/database/migrations/20240520_create_users.ts
import type { Database } from 'sqlite3';

export const up = (db: Database) => {
  db.exec(` CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(length(name) > 2),
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_users_email ON users(email); `);
};

export const down = (db: Database) => {
  db.exec('DROP TABLE IF EXISTS users');
};
```

### 2. Run Migrations

```bash
yarn postinstall
```
### 3. Type-safe CRUD Operations

```typescript

// src/renderer/services/userService.ts
interface User {
  id?: number;
  name: string;
  email: string;
}

export const UserService = {
  async create(user: User) {
    const { lastID } = await db.run(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [user.name, user.email]
    );
    return this.getById(lastID);
  },

  async getById(id: number) {
    return db.get<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
  }
}
```

## Advanced Configuration ⚙️

### Environment Variables

Create  `.env`  file:

```ini
# Main Process
VITE_APP_NAME="My Electron App"
VITE_APP_VERSION=1.0.0

# Database
VITE_DB_NAME=application.db
VITE_DB_ENCRYPTION_KEY=your-secure-key
```

### Build Targets

```bash
# Build for current platform
yarn build

# Build Windows x64
yarn build:win

# Build Linux AppImage
yarn build:linux

# Build macOS universal
yarn build:mac
```

## Best Practices Checklist ✅

1.  **IPC Security**
    
    -   Validate all IPC arguments with Zod
        
    -   Use dedicated channels for sensitive operations
        
    -   Implement rate limiting for high-frequency events
        
2.  **Database Optimization**
    
    -   Use transactions for bulk operations
        
    -   Enable WAL mode for concurrent access
        
    -   Regular vacuum operations for space reclaim
        
3.  **Performance**
    
    -   Freeze Vue non-reactive data
        
    -   Use Web Workers for CPU-heavy tasks
        
    -   Implement main/renderer process monitoring
        
4.  **Packaging**
    
    -   Sign binaries for all target platforms
        
    -   Use environment-specific builds
        
    -   Obfuscate sensitive code areas

## License 📄

Distributed under the MIT License. See  `LICENSE`  for more information.
