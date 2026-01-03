-- Fix security vulnerability: Restrict symptom_checks INSERT to authenticated users only
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can insert symptom checks" ON public.symptom_checks;

-- Create a new secure policy that requires authentication
CREATE POLICY "Authenticated users can insert their own symptom checks"
ON public.symptom_checks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also ensure SELECT is properly restricted to own records
DROP POLICY IF EXISTS "Users can view their own symptom checks" ON public.symptom_checks;

CREATE POLICY "Users can view their own symptom checks"
ON public.symptom_checks
FOR SELECT
USING (auth.uid() = user_id);