import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function check() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
    process.exit(1);
  }

  const cleanSupabaseUrl = process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const supabase = createClient(
    cleanSupabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  console.log("Checking Supabase Connection...");
  
  try {
    // Check if we can query public.users (or another table, or just a generic API endpoint)
    // A simpler check is to see if we can list users (tests Auth and the Service Role Key).
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (error) {
      console.error("Supabase Auth check failed:", error.message);
      process.exit(1);
    }
    
    console.log("Supabase Auth connection successful.");
    console.log("Supabase is correctly configured with the Service Role Key!");
  } catch (error: any) {
    console.error("Error connecting to Supabase:", error.message);
    process.exit(1);
  }
}

check();
