-- Location text + coordinates for distance calculations.
-- Idempotent: safe to re-run.

alter table public.opportunities
  add column if not exists location     text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

alter table public.profiles
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;
