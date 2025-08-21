import { supabase } from './lib/supabase';

export async function signIn(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
}

