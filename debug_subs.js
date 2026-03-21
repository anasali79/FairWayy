const { createClient } = require('@supabase/supabase-js');

// Must match the project's real SUPABASE URL and SERVICE ROLE
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nedxtackxjjmqqncxwho.supabase.co';
// Provide the anon key or service key found in the project's env
// Let's read from the env file.
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const anonMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const srMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const anonKey = anonMatch ? anonMatch[1] : '';
const srKey = srMatch ? srMatch[1] : '';

const supabase = createClient(supabaseUrl, srKey || anonKey);

async function check() {
    const { data, error } = await supabase.from('golf_winner_submissions').select('*');
    if (error) {
        console.error("Error retrieving submissions:", error);
    } else {
        console.log("Submissions found:", data.length);
        console.log(data);
    }
}

check();
