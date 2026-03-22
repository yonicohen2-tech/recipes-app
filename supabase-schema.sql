-- Run this in your Supabase SQL editor (supabase.com > SQL Editor)

-- Recipes table
CREATE TABLE recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  course_type text NOT NULL,
  dietary_tags text[] DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'medium',
  prep_time integer NOT NULL DEFAULT 0,
  cook_time integer NOT NULL DEFAULT 0,
  file_url text,
  file_type text,
  video_url text,
  added_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Recipes: anyone logged in can read
CREATE POLICY "Logged in users can read recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (true);

-- Recipes: logged in users can insert
CREATE POLICY "Logged in users can insert recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = added_by);

-- Recipes: only owner can delete
CREATE POLICY "Owners can delete their recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = added_by);

-- Comments: anyone logged in can read
CREATE POLICY "Logged in users can read comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

-- Comments: logged in users can insert
CREATE POLICY "Logged in users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for recipe files
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-files', 'recipe-files', true);

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipe-files');

-- Storage policy: public read
CREATE POLICY "Public can read files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'recipe-files');
