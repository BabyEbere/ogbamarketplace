import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhewxumicwxrvltrmrkh.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZXd4dW1pY3d4cnZsdHJtcmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMDE1NzAsImV4cCI6MjEwNTg3NzU3MH0.4Pp8zY2YiIER1O7Exd1fUU8ZZjIgxiz-Ad0iy5unGAo'
  );
}
