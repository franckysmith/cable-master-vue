-- Cable Master - Supabase Schema
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard > SQL Editor)

-- Table des catalogues
CREATE TABLE catalog (
  catalogid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  owner_name VARCHAR(50) DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des câbles
CREATE TABLE cable (
  cableid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(25) NOT NULL UNIQUE,
  type VARCHAR(20) CHECK (type IN ('electrical', 'speaker', 'microphone', 'module', 'special', 'other', 'c_type', 'accessory', 'digital')),
  sortno INT DEFAULT 0,
  weight INT DEFAULT 0,
  color VARCHAR(10) CHECK (color IN ('color1', 'color2', 'color3', 'color4', 'color5')),
  total INT DEFAULT 0,
  reserved INT DEFAULT 0,
  info VARCHAR(255) DEFAULT '',
  link TEXT DEFAULT '',
  catalog_id BIGINT REFERENCES catalog(catalogid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des affaires
CREATE TABLE affair (
  affairid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tech_id INT NOT NULL,
  tech_name VARCHAR(50) NOT NULL,
  name VARCHAR(50) NOT NULL,
  ref VARCHAR(50) DEFAULT '',
  description TEXT DEFAULT '',
  prep_date DATE,
  prep_time VARCHAR(10) CHECK (prep_time IN ('morning', 'afternoon')),
  receipt_date DATE NOT NULL,
  receipt_time VARCHAR(10) CHECK (receipt_time IN ('morning', 'afternoon')),
  return_date DATE NOT NULL,
  return_time VARCHAR(10) CHECK (return_time IN ('morning', 'afternoon')),
  front BOOLEAN DEFAULT FALSE,
  monitor BOOLEAN DEFAULT FALSE,
  stage BOOLEAN DEFAULT FALSE,
  master_note TEXT DEFAULT '',
  tech_note TEXT DEFAULT '',
  lz1 VARCHAR(20) DEFAULT '',
  lz2 VARCHAR(20) DEFAULT '',
  lz3 VARCHAR(20) DEFAULT '',
  lz4 VARCHAR(20) DEFAULT '',
  lz5 VARCHAR(20) DEFAULT '',
  lz6 VARCHAR(20) DEFAULT '',
  lfc1 VARCHAR(20) DEFAULT '',
  lfc2 VARCHAR(20) DEFAULT '',
  lfc3 VARCHAR(20) DEFAULT '',
  lfc4 VARCHAR(20) DEFAULT '',
  lfc5 VARCHAR(20) DEFAULT '',
  lfc6 VARCHAR(20) DEFAULT '',
  lfc7 VARCHAR(20) DEFAULT '',
  mg1 VARCHAR(20) DEFAULT '',
  mg2 VARCHAR(20) DEFAULT '',
  mg3 VARCHAR(20) DEFAULT '',
  mg4 VARCHAR(20) DEFAULT '',
  mg5 VARCHAR(20) DEFAULT '',
  done BOOLEAN DEFAULT FALSE,
  catalog_id BIGINT REFERENCES catalog(catalogid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, receipt_date)
);

-- Table des commandes (orders)
CREATE TABLE "order" (
  orderid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cableid BIGINT NOT NULL REFERENCES cable(cableid) ON DELETE CASCADE,
  affairid BIGINT NOT NULL REFERENCES affair(affairid) ON DELETE CASCADE,
  tech_id INT NOT NULL,
  count INT DEFAULT 0,
  spare_count INT DEFAULT 0,
  done BOOLEAN DEFAULT FALSE,
  tfc1 INT DEFAULT 0,
  tfc2 INT DEFAULT 0,
  tfc3 INT DEFAULT 0,
  tfc4 INT DEFAULT 0,
  tfc5 INT DEFAULT 0,
  tfc6 INT DEFAULT 0,
  tfc7 INT DEFAULT 0,
  tfc_done BOOLEAN DEFAULT FALSE,
  z1 INT DEFAULT 0,
  z2 INT DEFAULT 0,
  z3 INT DEFAULT 0,
  z4 INT DEFAULT 0,
  z5 INT DEFAULT 0,
  z6 INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cableid, affairid, tech_id)
);

-- Table des MFC (Master FlightCases)
CREATE TABLE mfc (
  mfcid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  info VARCHAR(255) DEFAULT '',
  tech_id INT,
  affairid BIGINT REFERENCES affair(affairid) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison câbles-MFC
CREATE TABLE cablemfc (
  mfcid BIGINT NOT NULL REFERENCES mfc(mfcid) ON DELETE CASCADE,
  cableid BIGINT NOT NULL REFERENCES cable(cableid) ON DELETE CASCADE,
  count INT DEFAULT 0,
  PRIMARY KEY (mfcid, cableid)
);

-- Activer Row Level Security (RLS) - pour l'instant tout est public
ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE cable ENABLE ROW LEVEL SECURITY;
ALTER TABLE affair ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfc ENABLE ROW LEVEL SECURITY;
ALTER TABLE cablemfc ENABLE ROW LEVEL SECURITY;

-- Policies pour accès public (à restreindre plus tard si besoin)
CREATE POLICY "Public access" ON catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON cable FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON affair FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON "order" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON mfc FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON cablemfc FOR ALL USING (true) WITH CHECK (true);
