-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ
);

-- Create activity_requests table (for join requests)
CREATE TABLE public.activity_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(activity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Activities policies
CREATE POLICY "Activities are viewable by everyone"
  ON public.activities FOR SELECT
  USING (ended_at IS NULL);

CREATE POLICY "Users can create activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = host_id);

-- Activity requests policies
CREATE POLICY "Hosts can view requests for their activities"
  ON public.activity_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.activities 
      WHERE activities.id = activity_requests.activity_id 
      AND activities.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own requests"
  ON public.activity_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
  ON public.activity_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'waiting');

CREATE POLICY "Hosts can update request status"
  ON public.activity_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.activities 
      WHERE activities.id = activity_requests.activity_id 
      AND activities.host_id = auth.uid()
    )
  );

-- Create function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();