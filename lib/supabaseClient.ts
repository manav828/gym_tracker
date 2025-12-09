import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://apikapurnhxrtbqpahwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaWthcHVybmh4cnRicXBhaHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjQ5NTMsImV4cCI6MjA4MDM0MDk1M30.c0ktiZ91nxtxZ3AzPl3DPl5397siWZyVeialCy_z2-g';

export const supabase = createClient(supabaseUrl, supabaseKey);