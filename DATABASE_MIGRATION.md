# Database Migration: Firebase to SQLite

## Overview
Successfully migrated from Firebase to a local SQLite database for better control, offline capability, and reduced dependencies.

## Changes Made

### 1. Database Setup
- **New**: `server/db/database.ts` - SQLite database initialization with all tables
- **New**: `server/db/animals.ts` - Animals data access layer
- **New**: `server/db/weights.ts` - Weight records data access layer
- **New**: `server/utils/id-generator.ts` - ID generation utility

### 2. Database Schema
Created the following tables:
- `animals` - Animal records with full tracking
- `barns` - Barn information
- `warehouse_items` - Inventory items
- `stock_movements` - Stock movement history
- `weight_records` - Weight tracking with cascade delete
- `feeding_records` - Feeding history
- `health_records` - Health and veterinary records
- `barn_movements` - Animal movement between barns
- `feeding_schedules` - Automated feeding schedules
- `barn_equipment` - Equipment tracking
- `mortality_records` - Mortality tracking
- `feed_efficiency_records` - Feed conversion analysis

### 3. API Updates
- **Updated**: `server/routes/weights.ts` - Now uses SQLite instead of Firebase
- **New**: `server/routes/animals.ts` - CRUD operations for animals
- **Updated**: `server/index.ts` - Added new routes and database initialization

### 4. Client Updates
- **Replaced**: `client/lib/data-service.ts` - Now uses local API instead of Firebase
- **Backed up**: Old Firebase implementation saved as `data-service-old.ts`

### 5. Dependencies
- **Removed**: `firebase`, `firebase-admin`
- **Added**: `better-sqlite3`, `@types/better-sqlite3`

## Database Location
The SQLite database file is created at: `/Users/ahmed/Downloads/farms99/Farm-202/farm-data.db`

## Features

### Current Features
✅ Animals management (CRUD)
✅ Weight tracking with automatic animal weight updates
✅ Weight statistics and reporting
✅ Database indexes for performance
✅ Foreign key constraints for data integrity
✅ Cascade deletes where appropriate

### To Implement
You can add similar data access layers for:
- Barns (`server/db/barns.ts`)
- Warehouse (`server/db/warehouse.ts`)
- Feeding (`server/db/feeding.ts`)
- Health (`server/db/health.ts`)
- etc.

## API Endpoints

### Animals
- `GET /api/animals` - Get all animals (supports ?category, ?barnId, ?earTag)
- `GET /api/animals/:id` - Get animal by ID
- `POST /api/animals` - Create new animal
- `PUT /api/animals/:id` - Update animal
- `DELETE /api/animals/:id` - Delete animal

### Weights
- `GET /api/weights/animal/:animalId` - Get weight report for animal
- `GET /api/weights/barn/:barnId` - Get weight report for barn
- `POST /api/weights/animal/:animalId` - Add weight record
- `DELETE /api/weights/animal/:animalId/weight/:weightId` - Delete weight record
- `GET /api/weights/all` - Get all animals with weights
- `GET /api/weights/statistics` - Get weight statistics

## Running the Application

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

## Migration Notes

### Data Migration
If you have existing data in Firebase, you'll need to:
1. Export data from Firebase
2. Create a migration script to insert into SQLite
3. Run the migration

### Client-Side Changes
The client code automatically detects that it's using the local API. No Firebase configuration is needed anymore.

## Benefits

1. **Offline Capability**: Works without internet connection
2. **No External Dependencies**: No Firebase account needed
3. **Better Performance**: Local database is faster
4. **Full Control**: Complete control over data and backups
5. **Cost**: No Firebase costs
6. **Privacy**: Data stays on your server

## Next Steps

1. **Add More Entities**: Create data access layers for remaining entities
2. **Add Validation**: Implement Zod schemas for API validation
3. **Add Authentication**: Implement user authentication
4. **Backup Strategy**: Set up automated backups of the SQLite database
5. **Testing**: Add unit tests for database operations
6. **Seeding**: Create seed data for development/testing

## Database Backup

To backup the database:
```bash
cp farm-data.db farm-data.backup.db
```

Or use SQLite's backup command:
```bash
sqlite3 farm-data.db ".backup farm-data.backup.db"
```

## Troubleshooting

### Database Locked Error
If you get "database is locked" errors:
- Make sure only one server instance is running
- Check for long-running transactions
- Use `PRAGMA busy_timeout = 5000;` to increase timeout

### Missing Indexes
If queries are slow, add indexes:
```sql
CREATE INDEX idx_name ON table_name(column_name);
```

## Performance Tips

1. Use prepared statements (already implemented)
2. Batch inserts when possible
3. Use transactions for multiple operations
4. Add indexes for frequently queried columns
5. Use `PRAGMA journal_mode = WAL;` for better concurrency
