import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqlfqvsnreqpmucvjmyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbGZxdnNucmVxcG11Y3ZqbXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzEzMzIsImV4cCI6MjA1MTMwNzMzMn0.wOaiglbRLScTPRqE6vr4PsI7qpd812fuLRnTAvIpD6c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);