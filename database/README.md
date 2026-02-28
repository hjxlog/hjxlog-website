# Database Scripts

## Naming Convention
- `dbschema_<major.minor>_<order>_<name>.sql`
- Example: `hw_1.0_create_table.sql`

## First-time Setup (One-shot Table Creation)
Run the schema entrypoint once:

```bash
psql "$DATABASE_URL" -f database/dbschema/hw_1.0_create_table.sql
```

This script creates extensions, functions, tables, indexes, and triggers.

## Schema Upgrade Scripts
For existing databases, run incremental schema scripts as needed:

```bash
psql "$DATABASE_URL" -f database/dbschema/hw_1.2_add_daily_thought_optimized_content.sql
psql "$DATABASE_URL" -f database/dbschema/hw_1.3_view_logs_refactor.sql
```

## Optional Data Scripts
- Required baseline seed data:

```bash
psql "$DATABASE_URL" -f database/preset/hw_1.0_preset_data.sql
```

- Incremental prompt/template preset updates:

```bash
psql "$DATABASE_URL" -f database/preset/hw_1.1_preset_data.sql
psql "$DATABASE_URL" -f database/preset/hw_1.2_preset_data.sql
```

`hw_1.2_preset_data.sql` uses upsert update for `thought_moment_polish`, so re-running it will refresh the prompt content.

- Local test data:

```bash
psql "$DATABASE_URL" -f database/test/hw_1.0_test_data.sql
```

## Legacy Cleanup Scripts
For upgrading older databases only:
- `database/dbschema/dbschema_1.0_901_cleanup_long_term_memory.sql`
- `database/dbschema/dbschema_1.0_902_cleanup_daily_thought_meta.sql`
