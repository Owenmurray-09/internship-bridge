-- Fixed category for browsing/filtering internships (keys match src/lib/categories.ts)
ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.internships
  DROP CONSTRAINT IF EXISTS internships_category_check;
ALTER TABLE public.internships
  ADD CONSTRAINT internships_category_check CHECK (
    category IS NULL OR category IN (
      'technology', 'food_hospitality', 'retail', 'healthcare', 'arts_media',
      'sports_recreation', 'education', 'trades', 'business_office', 'other'
    )
  );

CREATE INDEX IF NOT EXISTS internships_category_idx ON public.internships (category);
