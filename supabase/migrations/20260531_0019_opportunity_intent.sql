-- Add intent column to track which workflow option the user chose when creating an opportunity.
alter table public.opportunities
  add column if not exists intent text default 'post-opportunity';
