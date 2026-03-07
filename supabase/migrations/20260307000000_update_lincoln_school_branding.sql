-- Update Lincoln School branding with official colors and logo
UPDATE public.schools
SET
  primary_color = '#16254C',
  secondary_color = '#BD202F',
  logo_url = '/schools/lincoln-logo.png',
  updated_at = now()
WHERE slug = 'lincoln-school'
   OR name = 'Lincoln School';
