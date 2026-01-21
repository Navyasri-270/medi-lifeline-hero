-- Create hospital_availability table for real-time updates
CREATE TABLE public.hospital_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_id TEXT NOT NULL UNIQUE,
  hospital_name TEXT NOT NULL,
  emergency_beds INTEGER NOT NULL DEFAULT 0,
  icu_beds INTEGER NOT NULL DEFAULT 0,
  general_beds INTEGER NOT NULL DEFAULT 0,
  ambulances_available INTEGER NOT NULL DEFAULT 0,
  is_accepting_emergency BOOLEAN NOT NULL DEFAULT true,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  address TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hospital_availability ENABLE ROW LEVEL SECURITY;

-- Public read access for hospital availability (anyone can see hospital status)
CREATE POLICY "Hospital availability is publicly readable"
ON public.hospital_availability
FOR SELECT
USING (true);

-- Only authenticated users can update (for simulation purposes)
CREATE POLICY "Authenticated users can update hospital availability"
ON public.hospital_availability
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Allow inserts for seeding data
CREATE POLICY "Authenticated users can insert hospital data"
ON public.hospital_availability
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create sos_recordings table for emergency audio recordings
CREATE TABLE public.sos_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sos_log_id UUID REFERENCES public.sos_logs(id) ON DELETE CASCADE,
  recording_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  file_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sos_recordings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own recordings
CREATE POLICY "Users can insert own recordings"
ON public.sos_recordings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own recordings
CREATE POLICY "Users can view own recordings"
ON public.sos_recordings
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at on hospital_availability
CREATE TRIGGER update_hospital_availability_updated_at
BEFORE UPDATE ON public.hospital_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for hospital_availability table
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_availability;

-- Seed initial hospital data
INSERT INTO public.hospital_availability (hospital_id, hospital_name, emergency_beds, icu_beds, general_beds, ambulances_available, latitude, longitude, phone, address)
VALUES 
  ('h1', 'Apollo Emergency Hospital', 5, 3, 25, 3, 17.4156, 78.4347, '+914027231234', 'Jubilee Hills, Hyderabad'),
  ('h2', 'KIMS Hospital', 4, 2, 20, 2, 17.3982, 78.5214, '+914023221111', 'Secunderabad'),
  ('h3', 'Care Hospital Banjara Hills', 6, 4, 30, 4, 17.4139, 78.4397, '+914030418888', 'Banjara Hills, Hyderabad'),
  ('h4', 'Yashoda Hospital Somajiguda', 3, 2, 18, 2, 17.4346, 78.4982, '+914027812345', 'Somajiguda, Hyderabad'),
  ('h5', 'Continental Hospital', 7, 5, 35, 5, 17.4285, 78.3914, '+914067000000', 'Gachibowli, Hyderabad'),
  ('h6', 'NIMS Hospital', 8, 6, 40, 4, 17.4231, 78.5423, '+914023489012', 'Punjagutta, Hyderabad'),
  ('h7', 'Osmania General Hospital', 10, 8, 50, 6, 17.3898, 78.4827, '+914024655555', 'Afzalgunj, Hyderabad'),
  ('h8', 'Gandhi Hospital', 9, 7, 45, 5, 17.3945, 78.5012, '+914027505566', 'Musheerabad, Hyderabad'),
  ('h9', 'Sunshine Hospital', 4, 3, 22, 3, 17.4456, 78.3891, '+914023456789', 'Gachibowli, Hyderabad'),
  ('h10', 'MaxCure Hospital', 5, 3, 28, 3, 17.4512, 78.3834, '+914066200200', 'Madhapur, Hyderabad'),
  ('h11', 'Medicover Hospital', 6, 4, 32, 4, 17.4389, 78.4123, '+914068885588', 'Hitech City, Hyderabad'),
  ('h12', 'AIG Hospitals', 5, 4, 30, 3, 17.4234, 78.3678, '+914066667777', 'Gachibowli, Hyderabad'),
  ('h13', 'Yashoda Hospital Malakpet', 4, 2, 20, 2, 17.3756, 78.5089, '+914024567890', 'Malakpet, Hyderabad'),
  ('h14', 'Care Hospital Hitech City', 5, 3, 25, 3, 17.4456, 78.3789, '+914044556677', 'Hitech City, Hyderabad'),
  ('h15', 'Rainbow Children''s Hospital', 3, 2, 15, 2, 17.4312, 78.4567, '+914023445566', 'Banjara Hills, Hyderabad');