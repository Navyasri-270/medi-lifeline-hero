-- Drop the existing permissive policy that allows anyone to insert
DROP POLICY IF EXISTS "Anyone can insert SOS logs" ON public.sos_logs;

-- Create a new policy that only allows authenticated users to insert their own SOS logs
CREATE POLICY "Authenticated users can insert own SOS logs" 
ON public.sos_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);