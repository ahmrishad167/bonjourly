// Bonjourly online accounts. Fill in from Supabase → Project Settings → API.
// Both values are public by design (the anon key only allows what the database's row-level security permits).
// Never put the service_role key here. Leave them empty to run with on-device profiles only.
window.BJ_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
  // Where learners can reach the person responsible for privacy (shown on the privacy page).
  privacyContact: 'https://github.com/ahmrishad167/bonjourly/issues',
};
