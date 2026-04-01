import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'payment_status' });
  if (error) {
     // fallback if no rpc, let's just insert one and see the error? 
     // The error tells "invalid input value for enum", but it doesn't list the valid ones unfortunately.
  }
}
check();
