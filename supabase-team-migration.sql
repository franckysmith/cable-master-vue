-- Team : permettre à un FREELANCE d'avoir son équipe (collaborateurs).
--
-- Aujourd'hui le registre des personnes est rattaché à une entreprise
-- (technician.company_id). Un indépendant n'en a pas : il lui faut un
-- propriétaire de fiche, sinon sa Team serait celle de tout le monde.
--
-- À exécuter une fois dans le SQL Editor du hub (projet ahwixyrtqebukxlpxiwi),
-- schéma « mastercable ».

ALTER TABLE mastercable.technician
  ADD COLUMN IF NOT EXISTS owner_user_id uuid;

COMMENT ON COLUMN mastercable.technician.owner_user_id IS
  'Compte auth propriétaire de la fiche quand il n''y a pas d''entreprise (Team d''un freelance).';

-- Retrouver rapidement « ma » Team
CREATE INDEX IF NOT EXISTS technician_owner_user_id_idx
  ON mastercable.technician (owner_user_id);
