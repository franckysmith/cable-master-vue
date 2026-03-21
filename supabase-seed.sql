-- Cable Master - Données initiales (seed)
-- À exécuter dans Supabase SQL Editor APRÈS le schema

-- =============================================
-- CABLES HP (speaker)
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('Do 07', 'speaker', 201, NULL, NULL, 100, 0, 'Cable HP L-Acoustics shunt/link entre boites'),
('Do 10', 'speaker', 204, NULL, NULL, 250, 3, 'Cable HP L-Acoustics 10m'),
('Do 10p', 'speaker', 214, NULL, NULL, 142, 2, 'Cable HP L-Acoustics prolongateur'),
('Do 15p', 'speaker', 214, NULL, NULL, 200, 8, 'Cable HP L-Acoustics 15m prolongateur'),
('Do 20', 'speaker', 206, NULL, NULL, 122, 3, 'Cable HP L-Acoustics 20m'),
('Do 25', 'speaker', 207, NULL, NULL, 412, 3, 'Cable HP L-Acoustics 25m'),
('Dofill sans bg', 'speaker', 221, NULL, 'color2', 100, 2, 'Pour mettre après un "do"'),
('Dofill avec bg', 'speaker', 222, NULL, 'color2', 12, 3, 'Compatible avec prolongateurs Do10p'),
('Dosub sans bague', 'speaker', 223, NULL, NULL, 12, 8, 'Pour mettre après un "do"'),
('Spk 0.5', 'speaker', 237, NULL, 'color1', 45, 10, 'Cable Speakon 0.5m'),
('Spk 3m', 'speaker', 238, NULL, 'color1', 45, 10, 'Cable Speakon 3m'),
('Spk 5m', 'speaker', 239, NULL, 'color1', 32, 5, 'Cable Speakon 5m'),
('Spk 10m', 'speaker', 241, NULL, 'color1', 45, 5, 'Cable Speakon 10m'),
('Spk 10m P', 'speaker', 254, NULL, 'color1', 100, 3, 'Cable Speakon 10m prolongateur (un côté femelle)'),
('Spk 20m', 'speaker', 242, 900, 'color1', 9, 3, 'Cable Speakon 20m'),
('SPK 50m', 'speaker', 244, NULL, 'color1', 12, 3, 'Cable Speakon 50m'),
('Bouchon Spk', 'speaker', 255, 30, 'color1', 25, 5, 'Pour mettre bout à bout 2 cables Speakon'),
('Y SPK A,B', 'speaker', 256, NULL, 'color1', 30, 10, '1 femelle => 2 males channel A et B');

-- =============================================
-- CABLES ELECTRIQUES (electrical)
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('32 mono 5m', 'electrical', 100, NULL, 'color1', 120, 100, 'Connecteur Bleu'),
('32 mono 10m', 'electrical', 101, NULL, 'color1', 50, 2, 'Connecteur Bleu'),
('32 mono 15m', 'electrical', 102, NULL, 'color1', 200, 2, 'Connecteur Bleu'),
('32 tetra 5m', 'electrical', 110, NULL, 'color2', 45, 0, 'Connecteur Rouge'),
('32 tetra 10m', 'electrical', 110, NULL, 'color2', 100, 1, 'Connecteur Rouge'),
('Multiprise(x6)', 'electrical', 120, NULL, 'color3', 120, 20, 'Boitier multiprise 6 emplacements 220v - 2m'),
('16A 3m', 'electrical', 100, NULL, 'color4', 100, 20, 'Cable rallonge 16 ampères 3m'),
('16A 5m', 'electrical', 100, NULL, 'color4', 100, 20, 'Cable rallonge 16 ampères 5m'),
('16A 10m', 'electrical', 100, NULL, 'color4', 100, 22, 'Cable rallonge 16 ampères 10m'),
('16A 15m', 'electrical', 100, NULL, 'color4', 50, 10, 'Cable rallonge 16 ampères 15m'),
('16A 20m', 'electrical', 100, NULL, 'color4', 100, 20, 'Cable rallonge 16 ampères 20m');

-- =============================================
-- MODULES
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('Multi 4p 3m', 'module', 400, NULL, 'color2', 12, 4, '4 paires XLR femelle/male 3m'),
('Multi 4p 10m', 'module', 400, NULL, 'color2', 5, 2, '4 paires XLR femelle/male 10m'),
('Multi 8p 3m', 'module', 400, NULL, 'color2', 12, 4, '8 paires'),
('Multi 8p 5m', 'module', 400, NULL, 'color2', 12, 3, '8 paires'),
('Module 5m', 'module', 403, NULL, NULL, 50, 10, 'Module XLR 5m'),
('Module 10m', 'module', 404, NULL, NULL, 500, 50, 'Module XLR 10m'),
('Module 15m', 'module', 405, NULL, NULL, 56, 22, 'Module XLR 15m'),
('Module 30m', 'module', 406, NULL, NULL, 14, 5, 'Module XLR 30m'),
('Module 50m', 'module', 407, NULL, NULL, 5, 2, 'Module XLR 50m'),
('Multi 12p 5m', 'module', 450, NULL, 'color5', 12, 0, 'Compatibles avec Ep 12p XLR'),
('Multi 12p 10m', 'module', 451, NULL, 'color5', 32, 6, 'Compatibles avec Ep 12p XLR'),
('Multi 12p 15m', 'module', 452, NULL, 'color5', 32, 6, 'Compatibles avec Ep 12p XLR'),
('Ep 12p XLRf', 'module', 460, NULL, 'color5', 25, 6, 'Épanoui 12 paires XLR femelle (sans bague)'),
('Ep 12p XLRm', 'module', 461, NULL, 'color5', 21, 5, 'Épanoui 12 paires XLR males (avec bague)'),
('XLRF / 2M', 'module', 496, NULL, 'color3', 122, 5, 'Y: 1 femelle => 2 Males'),
('XLRM / 2F', 'module', 496, NULL, 'color3', 12, 4, 'Y: 1 Male => 2 Femelles'),
('XLR f / JackSt', 'module', 498, NULL, 'color3', 60, 10, 'Adaptateur XLR femelle / Jack stéréo'),
('Jack / Jack St', 'module', 499, NULL, 'color3', 25, 4, 'Jack 6,35 stéréo'),
('XLR m / JackSt', 'module', 500, NULL, 'color3', 21, 4, 'Adaptateur XLR male / Jack stéréo');

-- =============================================
-- MICROPHONES
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('Sm 57', 'microphone', 300, NULL, 'color1', 12, 0, 'Shure'),
('Sm 58', 'microphone', 300, NULL, 'color1', 30, 0, 'Shure'),
('Sm 58 SE', 'microphone', 300, NULL, 'color1', 10, 3, 'Shure avec interrupteur'),
('Beta 52', 'microphone', 300, NULL, 'color1', 21, 3, 'Shure'),
('Beta 56A', 'microphone', 300, NULL, 'color1', 7, 2, 'Shure Supercardioïde'),
('Beta 57A', 'microphone', 300, NULL, 'color1', 35, 10, 'Shure'),
('Beta 58', 'microphone', 300, NULL, 'color1', 21, 2, 'Shure'),
('Beta 58A', 'microphone', 300, NULL, 'color1', 25, 5, 'Shure'),
('Beta 91', 'microphone', 300, NULL, NULL, 20, 3, 'Shure'),
('Beta 98', 'microphone', 300, NULL, 'color1', 10, 0, 'Shure'),
('Senn. Md 421', 'microphone', 300, NULL, NULL, 3, 4, 'Sennheiser'),
('E 604', 'microphone', 300, NULL, NULL, 20, 3, 'Sennheiser'),
('KM 184', 'microphone', 300, NULL, NULL, 20, 3, 'Neumann'),
('C414 XLS', 'microphone', 300, NULL, NULL, 6, 2, 'AKG'),
('RE20', 'microphone', 300, NULL, NULL, 6, 2, 'Electrovoice'),
('Audix i5', 'microphone', 300, NULL, NULL, 6, 2, 'Audix'),
('Audix D2', 'microphone', 300, NULL, NULL, 20, 3, 'Audix'),
('Audix D4', 'microphone', 300, NULL, NULL, 6, 2, 'Audix'),
('Audix D6', 'microphone', 300, NULL, NULL, 5, 2, 'Audix'),
('DI Radial J48', 'microphone', 300, 720, NULL, 24, 5, 'Boîtier DI active'),
('DI Countryman', 'microphone', 300, NULL, NULL, 20, 3, 'Boîtier DI'),
('dpa 4099', 'microphone', 300, NULL, NULL, 20, 3, 'DPA instrument');

-- =============================================
-- DIGITAL
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('Bnc 3m', 'digital', 800, NULL, 'color1', 5, 1, 'Belden'),
('Bnc 5m', 'digital', 804, NULL, 'color1', 6, 1, 'Belden'),
('Bnc 10m', 'digital', 805, NULL, 'color1', 5, 2, 'Belden'),
('Rj45 50m', 'digital', 811, NULL, 'color2', 4, 1, 'Belden liaisons Dante et AVB'),
('Rj45 100m', 'digital', 812, NULL, 'color2', 188, 5, 'S2CEB liaison Dante et AVB');

-- =============================================
-- SPECIAL
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('Grand Pied Mic', 'special', 500, NULL, 'color1', 45, 12, 'Pied de micro grand'),
('Optique Adat', 'special', 500, NULL, NULL, 12, 3, 'Cable optique 3m norme ADAT'),
('BNC 30cm 50Ohm', 'special', 500, NULL, NULL, 12, 3, 'Liaison récepteur/émetteur HF'),
('Optique', 'special', 570, NULL, NULL, 15, 5, 'Cable optique 3m'),
('Rj45 0.5m', 'special', 600, NULL, 'color2', 10, 2, 'RJ45 court'),
('Rj45 1m', 'special', 600, NULL, 'color2', 10, 2, 'RJ45'),
('Rj45 2m', 'special', 600, NULL, 'color2', 10, 2, 'RJ45'),
('Rj45 5m', 'special', 600, NULL, 'color2', 10, 2, 'RJ45'),
('Rj45 10m', 'special', 600, NULL, 'color2', 10, 2, 'RJ45'),
('Rj45 20m', 'special', 600, NULL, 'color2', 10, 2, 'RJ45'),
('Rj45 30m', 'special', 600, NULL, 'color2', 10, 2, 'RJ45'),
('Rj45 50m patch', 'special', 600, NULL, 'color2', 10, 2, 'RJ45 patch 50m');

-- =============================================
-- OTHER
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('Multi 50m Hartin', 'other', 650, NULL, 'color5', 32, 3, 'Multi 32 paires analogue 50m Harting'),
('Antenne directionnelle', 'other', 600, NULL, NULL, 12, 3, 'Antenne directionnelle active UA874 Shure');

-- =============================================
-- CAISSES-TYPE (c_type)
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('MFC1', 'c_type', 700, NULL, NULL, 33, 0, 'Caisse régie 1'),
('MFC2', 'c_type', 700, NULL, NULL, 3, 0, 'Caisse régie 32 paires'),
('Multi HP 12', 'c_type', 700, NULL, NULL, 3, 0, 'Caisse multi HP'),
('Regie 40', 'c_type', 700, NULL, 'color4', 3, 1, 'Caisse régie 40');

-- =============================================
-- ACCESSOIRES
-- =============================================
INSERT INTO cable (name, type, sortno, weight, color, total, reserved, info) VALUES
('Petit pied Mic', 'accessory', 900, NULL, 'color1', 22, 5, 'Pied de micro petit'),
('Élingue 1T 2m', 'accessory', 900, NULL, 'color1', 8, 2, 'Élingue de sécurité 2m'),
('Élingue 1T 3m', 'accessory', 900, NULL, 'color1', 27, 5, 'Élingue de sécurité 3m'),
('Barnier noir', 'accessory', 900, NULL, 'color2', 85, 8, 'Ruban adhésif'),
('Gaffeur noir', 'accessory', 900, NULL, 'color2', 55, 10, 'Gaffer noir'),
('Gaffeur blanc', 'accessory', 900, NULL, 'color2', 5, 10, 'Gaffer blanc'),
('Piles LR3', 'accessory', 900, NULL, 'color2', 500, 100, 'Piles AAA'),
('Piles LR6', 'accessory', 900, NULL, 'color2', 500, 100, 'Piles AA - pocket HF Shure'),
('Piles 6LR61 9v', 'accessory', 900, NULL, 'color2', 10, 2, 'Piles 9V');
