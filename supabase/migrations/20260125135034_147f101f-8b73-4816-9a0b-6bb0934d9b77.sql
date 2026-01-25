-- Remove dangerous policies that allow any authenticated user to modify hospital data
-- Hospital availability should only be read-only for standard users

DROP POLICY IF EXISTS "Authenticated users can update hospital availability" ON public.hospital_availability;
DROP POLICY IF EXISTS "Authenticated users can insert hospital data" ON public.hospital_availability;