-- Extend test cleanup to include daily_reports

TRUNCATE TABLE
  daily_reports
RESTART IDENTITY CASCADE;
