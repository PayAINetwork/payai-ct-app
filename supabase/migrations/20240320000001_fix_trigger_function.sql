-- Fix trigger function security settings
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = public; 