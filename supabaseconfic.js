const SUPABASE_URL = "https://hojyicohcqqknfwgfkct.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_HDrjvHHHC40fqAv4s61XLA_Vp38jiAn";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);
