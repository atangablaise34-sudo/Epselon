import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    console.log("Users in Supabase:", data.users.length);
    console.log(data.users.map(u => u.email));
  } catch (e: any) {
    console.log("Exception!", e.message);
  }
}
run();
