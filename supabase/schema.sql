-- ────────────────────────────────────────────────────────────────────────────
-- FrameInGoa — HH Goa 2026  |  Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to create all required tables.
-- ────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── users ──────────────────────────────────────────────────────────────────
-- One row per account. Users may sign in via X (Twitter) and/or a Web3 wallet.
create table if not exists users (
  id                    uuid primary key default gen_random_uuid(),
  twitter_id            text unique,
  twitter_username      text,
  twitter_name          text,
  twitter_profile_image text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── builder_profiles ────────────────────────────────────────────────────────
-- One per user. Holds the public-facing identity card data.
create table if not exists builder_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  builder_id          text unique not null,       -- e.g. HHG26-4F9A-82D1
  name                text not null,
  title               text,
  role                text,
  bio                 text,
  stack               text[],                     -- e.g. ['React', 'Three.js']
  github              text,
  twitter             text,
  website             text,
  theme_id            text not null default 'cyber',
  badge_number        text,
  photo_url           text,
  card_image_url      text,
  crop                jsonb,                      -- { x, y }
  zoom                double precision default 1.0,
  rotation            double precision default 0.0,
  cropped_area_pixels jsonb,                      -- { x, y, width, height }
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Partial unique index: each user can only have one profile
create unique index if not exists builder_profiles_user_id_idx on builder_profiles(user_id);

-- ─── wallets ─────────────────────────────────────────────────────────────────
-- Verified EVM wallet addresses per user. Private keys are NEVER stored.
create table if not exists wallets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  address     text not null,                      -- lowercase checksum address
  wallet_type text not null default 'evm',        -- 'evm' | 'solana' | 'walletconnect'
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, address)
);

-- ─── generated_cards ──────────────────────────────────────────────────────────
-- Optional audit log of every exported card (for analytics / leaderboard).
create table if not exists generated_cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete set null,
  profile_id  uuid references builder_profiles(id) on delete set null,
  card_type   text not null default 'card',       -- 'card' | 'pfp'
  theme_id    text,
  created_at  timestamptz not null default now()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────
-- Our API routes use a service-role key (bypasses RLS), so these policies
-- protect direct client access if ever enabled.

alter table users enable row level security;
alter table builder_profiles enable row level security;
alter table wallets enable row level security;
alter table generated_cards enable row level security;

-- builder_profiles is public-readable (anyone can view a profile by builder_id)
create policy "Public read builder_profiles"
  on builder_profiles for select
  using (true);

-- wallets: only public address fields are readable by anyone
create policy "Public read wallets address"
  on wallets for select
  using (true);

-- generated_cards: public read for gallery
create policy "Public read generated_cards"
  on generated_cards for select
  using (true);

-- ─── Helper function: auto-update updated_at ─────────────────────────────────
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger users_updated_at
  before update on users
  for each row execute procedure update_updated_at_column();

create or replace trigger builder_profiles_updated_at
  before update on builder_profiles
  for each row execute procedure update_updated_at_column();
