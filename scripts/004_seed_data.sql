-- Insert default admin user (this will be created manually by admin)
-- Note: This is just for reference, actual users will be created through the admin interface

-- Sample projects for testing (optional)
INSERT INTO public.projects (name, description, location, status, color, start_date, end_date) VALUES
  ('Chantier Centre-Ville', 'Construction d''un immeuble de bureaux', '123 Rue de la Paix, Paris', 'EN_COURS', '#10B981', '2024-01-15', '2024-06-30'),
  ('Rénovation École', 'Rénovation complète de l''école primaire', '45 Avenue des Écoles, Lyon', 'EN_ATTENTE', '#F59E0B', '2024-03-01', '2024-08-15'),
  ('Pont Autoroutier', 'Construction d''un nouveau pont', 'A6 Sortie 12, Marseille', 'EN_COURS', '#EF4444', '2024-02-01', '2024-12-31')
ON CONFLICT DO NOTHING;
