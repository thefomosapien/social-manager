create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  color_primary text,
  voice_prompt text,
  created_at timestamptz default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  platform text not null,
  handle text,
  access_token text,
  token_secret text,
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  account_id uuid references accounts(id),
  platform text not null,
  copy text not null,
  status text default 'draft',
  source text default 'routine',
  debate_ref text,
  image_url text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table routine_runs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  triggered_at timestamptz default now(),
  posts_generated int,
  status text
);

-- Seed brands
insert into brands (name, slug, color_primary, voice_prompt) values
  ('Duhbate', 'duhbate', '#6B46C1', 'Witty, provocative debate commentary with a pop-culture edge'),
  ('Historia', 'historia', '#B45309', 'Authoritative historical storytelling with surprising parallels to today'),
  ('Peptides 101', 'peptides-101', '#0F766E', 'Accessible science-forward wellness content for biohackers');

-- Seed demo posts for Duhbate
insert into posts (brand_id, platform, copy, status, source) values
  ((select id from brands where slug = 'duhbate'), 'twitter', 'Hot take: the "pineapple on pizza" debate is just a proxy war for deeper cultural anxieties. Fight me. 🍍🍕 #Duhbate', 'draft', 'routine'),
  ((select id from brands where slug = 'duhbate'), 'instagram', 'We need to talk about why everyone suddenly became a sourdough expert in 2020 and why that says everything about us as a society. Drop your unpopular opinion below 👇 #Duhbate #TrueThough', 'draft', 'routine'),
  ((select id from brands where slug = 'duhbate'), 'twitter', 'Counterargument: morning people are just night people who gave up. Discuss. ☀️ #Duhbate', 'approved', 'routine'),
  ((select id from brands where slug = 'duhbate'), 'linkedin', 'Unpopular opinion: "hustle culture" is just productivity theater. Real output comes from recovery, not grind. Share your take 👇 #LeadershipDebate #Duhbate', 'draft', 'routine'),
  ((select id from brands where slug = 'duhbate'), 'twitter', 'Thesis: the Oxford comma debate is actually about control, not grammar. People who care too much about it also alphabetize their spice rack. 🌶️ #Duhbate', 'published', 'routine');

-- Seed demo posts for Historia
insert into posts (brand_id, platform, copy, status, source) values
  ((select id from brands where slug = 'historia'), 'twitter', 'In 1347, Venetian merchants unknowingly imported Black Death from Caffa. They quarantined ships for 30 days ("quarantino"). 677 years later we''re still using their word. History doesn''t repeat — it echoes. 🏛️ #Historia', 'draft', 'routine'),
  ((select id from brands where slug = 'historia'), 'instagram', 'The Roman Empire fell not in a day, but over 200 years of slow institutional decay. Sound familiar? Every generation thinks they''re witnessing the fall. Sometimes they''re right. 📜 #Historia #LessonsFromHistory', 'draft', 'routine'),
  ((select id from brands where slug = 'historia'), 'twitter', 'Napoleon was 5''7". Average for his era. His "short" reputation was British propaganda — and it worked so well we still repeat it 200 years later. Never underestimate a good narrative. #Historia', 'approved', 'routine');

-- Seed demo posts for Peptides 101
insert into posts (brand_id, platform, copy, status, source) values
  ((select id from brands where slug = 'peptides-101'), 'twitter', 'BPC-157 isn''t magic. It''s a signaling peptide that upregulates growth hormone receptors and promotes angiogenesis. The "magic" is your body doing what it was always capable of. 🧬 #Peptides101', 'draft', 'routine'),
  ((select id from brands where slug = 'peptides-101'), 'instagram', 'Your sleep quality determines 80% of your recovery. No peptide stack beats 8hrs of deep sleep. Get the basics locked before you optimize the margins. 💤 #Peptides101 #BiohackingBasics', 'draft', 'routine'),
  ((select id from brands where slug = 'peptides-101'), 'twitter', 'Unpopular biohacking take: most people don''t need a $500/month peptide protocol. They need water, sleep, and a walk outside. Start there. 🌿 #Peptides101 #FoundationalHealth', 'approved', 'routine');
