-- Create profiles table for user medical info
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  age INTEGER,
  blood_group TEXT,
  allergies TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  avatar_type TEXT DEFAULT 'adult' CHECK (avatar_type IN ('adult', 'senior', 'child')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'te')),
  work_mode_enabled BOOLEAN DEFAULT false,
  work_mode_start_hour INTEGER DEFAULT 9,
  work_mode_end_hour INTEGER DEFAULT 17,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_reports table for medical documents
CREATE TABLE public.health_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('lab', 'prescription', 'scan', 'other')),
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  is_emergency_accessible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create emergency_contacts table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_default BOOLEAN DEFAULT false,
  notify_sms BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create symptom_checks table for AI analysis history
CREATE TABLE public.symptom_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  symptoms TEXT NOT NULL,
  ai_response TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('emergency', 'consult_soon', 'monitor')),
  follow_up_questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sos_logs table
CREATE TABLE public.sos_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contacts_notified TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Health reports policies
CREATE POLICY "Users can view own reports"
  ON public.health_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.health_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.health_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON public.health_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Emergency contacts policies
CREATE POLICY "Users can view own contacts"
  ON public.emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON public.emergency_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON public.emergency_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- Symptom checks policies (allow anonymous for guest mode)
CREATE POLICY "Users can view own symptom checks"
  ON public.symptom_checks FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert symptom checks"
  ON public.symptom_checks FOR INSERT
  WITH CHECK (true);

-- SOS logs policies
CREATE POLICY "Users can view own SOS logs"
  ON public.sos_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert SOS logs"
  ON public.sos_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own SOS logs"
  ON public.sos_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for health reports
INSERT INTO storage.buckets (id, name, public) VALUES ('health-reports', 'health-reports', false);

-- Storage policies for health reports
CREATE POLICY "Users can upload own reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own reports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'name');
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();