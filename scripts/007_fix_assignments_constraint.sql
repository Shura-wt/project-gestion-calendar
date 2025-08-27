-- Correction de la syntaxe pour supprimer la contrainte
-- Suppression de la contrainte unique qui empêche les affectations multiples
ALTER TABLE assignments 
DROP CONSTRAINT IF EXISTS assignments_user_id_assignment_date_key;

-- Nouvelle contrainte : un utilisateur ne peut être assigné qu'une seule fois au même projet le même jour
ALTER TABLE assignments 
ADD CONSTRAINT assignments_user_project_date_unique 
UNIQUE (user_id, project_id, assignment_date);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_assignments_date_project ON assignments(assignment_date, project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_date ON assignments(user_id, assignment_date);
