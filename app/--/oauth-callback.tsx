import { useURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function OAuthCallback() {
  const url = useURL();
  const router = useRouter();

  useEffect(() => {
    if (url) {
      supabase.auth.exchangeCodeForSession(url).then(() => {
        router.replace('/');
      });
    }
  }, [url]);

  return null;
}