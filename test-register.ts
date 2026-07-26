import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const email = "test-register-" + Date.now() + "@example.com";
  console.log("Creating user:", email);
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: false,
      user_metadata: { full_name: "Test User" }
    });
    console.log("Create user result:", data?.user?.id, error);
    
    if (data?.user) {
      console.log("Resending...");
      const resendRes = await supabase.auth.resend({
        type: "signup",
        email
      });
      console.log("Resend result:", resendRes);
    }
  } catch (e: any) {
    console.log("Exception!", e.message);
  }
}
run();
