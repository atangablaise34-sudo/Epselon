import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    console.log("Users in public.users:", data.length);
    console.log(data);
  } catch (e: any) {
    console.log("Exception!", e.message);
  }
}
run();
