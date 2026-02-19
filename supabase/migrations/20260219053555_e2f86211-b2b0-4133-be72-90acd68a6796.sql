
-- 1. Add DELETE policy for sos_logs
CREATE POLICY "Users can delete own SOS logs"
  ON public.sos_logs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. Remove duplicate SELECT policy on symptom_checks
DROP POLICY IF EXISTS "Users can view their own symptom checks" ON public.symptom_checks;
