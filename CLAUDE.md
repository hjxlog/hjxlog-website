# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Vite + React)
- `npm run dev` - Start dev server (port 3001, with --host flag)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend (Express.js)
- `npm run server:start` - Start backend server (port 3006)
- `npm run server:dev` - Start backend with --watch for auto-restart

### Combined Development
Run both servers simultaneously:
- Frontend: `npm run dev` → http://localhost:3001
- Backend: `npm run server:start` → http://localhost:3006

**Important**: The dev API base URL is configured as `http://localhost:3007` in `src/config/api.ts`, but the backend runs on port 3006. You may need to adjust either the backend port or the API base URL to match.

## Architecture Overview

This is a full-stack personal blog website with a monorepo structure:

```
hjxlog-website/
├── src/              # React frontend (Vite, TypeScript, TailwindCSS)
├── server/           # Express.js backend (Node.js ES modules)
├── crawler/          # Python web scraper for AI news
└── database/         # PostgreSQL schema and test data
```

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with manual chunk splitting
- **Styling**: TailwindCSS with `@tailwindcss/typography` plugin
- **Routing**: React Router v7
- **State Management**: React Context (AuthContext for authentication)
- **Path Aliases**: `@/*` maps to `./src/*` (configured via vite-tsconfig-paths)

### Backend Stack
- **Framework**: Express.js with ES modules (`"type": "module"`)
- **Database**: PostgreSQL with `pg` Client (single connection, not pool)
- **Auth**: bcrypt for password hashing
- **File Upload**: multer with memory storage, uploads to Aliyun OSS
- **Scheduler**: node-cron for scheduled tasks

## Frontend Architecture

### Centralized API Configuration

All API calls should use `apiRequest()` from `src/config/api.ts`:

```typescript
import { apiRequest } from '@/config/api';
const data = await apiRequest('/api/blogs?page=1');
```

The helper automatically:
- Adds Bearer token from localStorage if available
- Handles Content-Type headers
- Throws on non-OK responses

**Dev API URL**: `http://localhost:3007` (hardcoded in `src/config/api.ts`)
**Prod API URL**: Empty string (uses relative path for nginx proxy)

### Authentication Flow

Authentication is managed through `AuthContext` (defined in `src/contexts/authContext.ts`):

- **State**: `isAuthenticated`, `user` object with `id`, `username`, `email`, `avatar`, `bio`
- **Storage**: Token stored in localStorage with 7-day expiration
- **Login**: Sets auth state, optionally persists to localStorage
- **Logout**: Clears auth state and localStorage, redirects to `/login`
- **Token Validation**: `isTokenValid()` checks expiration date on app load

Protected routes in `App.tsx` check `isAuthenticated` before rendering:
```tsx
<Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Login />} />
```

### Route Structure

**Public Routes**:
- `/` - Home page
- `/works` - Portfolio list
- `/works/:id` - Portfolio detail
- `/blogs` - Blog list
- `/blog/:id` - Blog post detail
- `/moments` - Moments (social feed)
- `/moments/:id` - Moment detail
- `/photos` - Photography gallery
- `/ai-news` - AI industry news
- `/login` - Login page

**Protected Routes** (require authentication):
- `/dashboard` - Admin dashboard
- `/profile` - User profile
- `/admin/blogs` - Blog management
- `/admin/blog/create` - Create new blog
- `/admin/blog/edit/:id` - Edit existing blog
- `/admin/crawler` - Crawler task management

### Build Configuration

`vite.config.ts` includes:
- **Manual chunk splitting**: Separates React core, router, Three.js, Framer Motion, and vendor libraries
- **Terser minification**: Drops `console.log`, `console.info`, and `debugger` in production
- **Chunk size warning**: 800 KB threshold
- **Path aliases**: `@/*` → `./src/*` via `vite-tsconfig-paths`
- **Server warmup**: Preloads `Home.tsx` and `PublicNav.tsx` on dev start

## Backend Architecture

### Entry Point & Database

`server/server.js` is the main entry point:

- Creates a single PostgreSQL `Client` (not pool) on startup
- Database config from environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Graceful shutdown on SIGINT closes DB connection

### Routing Organization

Routes are split between inline definitions and modular routers:

**Inline in `server.js`**:
- `/api/blogs` - CRUD operations, categories, view/like tracking
- `/api/works` - Portfolio CRUD, featured toggle
- `/api/moments` - Social posts with images
- `/api/photos` - Photo gallery CRUD, batch delete
- `/api/comments` - Blog comments
- `/api/auth/*` - Register, login
- `/api/users/*` - User management, password change
- `/api/upload/*` - File upload to OSS
- `/api/admin/logs` - System log viewing
- `/api/health` - Health check

**Modular routers** in `server/routes/`:
- `createAiNewsRouter(getDbClient)` - AI news endpoints at `/api/ai-news`
- `createCrawlerRouter(getDbClient, getCrawlerService)` - Crawler management at `/api/crawler`

Router functions accept **getter functions** instead of direct values to avoid initialization order issues.

### Crawler Service

`CrawlerService` (in `server/services/CrawlerService.js`):
- Manages scheduled web scraping tasks using `node-cron`
- Loads active tasks from `crawler_tasks` table on startup
- Spawns Python scripts from `crawler/run.py` using configured `PYTHON_PATH` (defaults to `python3`)
- Validates cron expressions before scheduling

### Logging System

Comprehensive logging to `system_logs` table:

- **Request logging middleware**: Logs all API requests with IP, user agent, timing
- **Error logging middleware**: Captures errors with context
- **Logger creation**: `createLogger(dbClient)` returns methods `system()`, `error()`, etc.
- **Frontend error reporting**: POST to `/api/logs/frontend` captures client-side errors with browser info

Log entries include: `log_type`, `level`, `module`, `action`, `description`, `error_message`, and JSON `request_data`.

### File Upload (Aliyun OSS)

Located in `server/utils/ossConfig.js`:
- `uploadToOSS()` - Single file upload
- `uploadMultipleToOSS()` - Batch upload (max 10 files)
- `deleteFromOSS()` - Delete file
- `generatePresignedUrl()` - Generate URL for frontend direct upload
- File type validation: JPEG, PNG, GIF, WebP only
- File size limit: 20MB per file, max 10 files

### API Response Format

All endpoints follow consistent response structure:
```json
{
  "success": boolean,
  "data"?: any,
  "message"?: string
}
```

## Database Schema

PostgreSQL database with tables organized by feature:

**Content**:
- `blogs` - Blog posts with `published`, `featured` flags
- `works` - Portfolio projects with `status` (active/completed/planned)
- `moments` - Social posts with `visibility` (public/private), comma-separated `images`
- `photos` - Photography gallery with `category`, `location`, `taken_at`

**Engagement** (IP-tracked with rate limiting):
- `blog_views` - 5-minute cooldown per IP
- `blog_likes` - 10-minute cooldown per IP
- `moment_likes` - Toggle-based (can unlike)
- `comments` - Blog comments (anonymous + admin replies)
- `moment_comments` - Moment comments with `status` (approved/pending)

**System**:
- `users` - User accounts with bcrypt password hashing
- `system_logs` - Application logs with filtering
- `crawler_tasks` - Scheduled tasks with cron expressions
- `crawler_logs` - Task execution logs
- `ai_news` - AI industry news (populated by crawler)

Schema files in `database/`:
- `create_tables.sql` - Core application tables
- `create_ai_tables.sql` - AI news and crawler tables
- `insert_test_data.sql` - Sample data for development

## Key Implementation Details

### IP-Based Rate Limiting
- Blog views: 5-minute cooldown per IP address
- Blog likes: 10-minute cooldown per IP address
- Moment likes: One like per IP (can toggle/unlike)
- IP extraction: `req.ip || req.connection.remoteAddress || req.socket.remoteAddress`

### Images Storage
- Images stored as comma-separated URLs in database (not arrays)
- Frontend parses with `string_to_array(images, ',')` in SQL
- When updating: join array with commas before saving

### Admin Route Patterns
Admin pages follow `/admin/{resource}` pattern for consistency.

### CORS & Middleware
- CORS enabled for all origins
- JSON body parsing with 20MB limit
- Request logging runs before all routes
- Error logging runs after all routes (via error middleware)

### Environment Variables
Backend requires in `server/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hjxlog
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3006
PYTHON_PATH=python3  # Optional, defaults to python3
```

OSS configuration also required in `server/utils/ossConfig.js` (not shown in provided files).
