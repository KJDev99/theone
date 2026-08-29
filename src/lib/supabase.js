'use client';

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * When a public board should show only one teacher's classes, set
 * NEXT_PUBLIC_TEACHER_ID to that teacher's user id. Leave it empty and the
 * public pages show everything in the project — which is what you want when
 * one school runs one Supabase project.
 */
export const PUBLIC_TEACHER_ID = process.env.NEXT_PUBLIC_TEACHER_ID || null;

/**
 * The app runs with no Supabase project at all: it then keeps everything in
 * this browser, exactly as it did before. Adding the two env vars is what
 * switches it over to the shared database.
 */
export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

let client = null;

export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
