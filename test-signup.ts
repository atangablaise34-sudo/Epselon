import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Wait, normally signUp uses ANON key. We can use service role key too.

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const email = "test-signup-" + Date.now() + "@gmail.com";
  console.log("Signing up user:", email);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: "password123",
      options: {
        data: { full_name: "Test User" }
      }
    });
    console.log("Signup result:", data?.user?.id, error);
  } catch (e: any) {
    console.log("Exception!", e.message);
  }
}
run();
