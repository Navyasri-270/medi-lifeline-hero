-- Fix: Remove 'OR user_id IS NULL' from sos_logs SELECT policy to prevent anonymous data exposure
DROP POLICY IF EXISTS "Users can view own SOS logs" ON public.sos_logs;

CREATE POLICY "Users can view own SOS logs" 
  ON public.sos_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Also fix the same issue in symptom_checks table
DROP POLICY IF EXISTS "Users can view own symptom checks" ON public.symptom_checks;

CREATE POLICY "Users can view own symptom checks" 
  ON public.symptom_checks 
  FOR SELECT 
  USING (auth.uid() = user_id);