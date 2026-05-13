/* ============================================================
   HappyFeet: config.js
   Supabase configuration

   FOR NOW WE'RE GONNA PRETEND IT'S A GOOD IDEA TO KEEP AN ANON KEY
   AND NOT COMMIT IT, BUT ONCE WE SWITCH TO A PRIVATE REPO + NETLIFY
   TO HOST, WE WON'T DO THIS
   ============================================================ */

const HF_CONFIG = {
  SUPABASE_URL: "https://ngjwwmfzkprmztqflllg.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nand3bWZ6a3BybXp0cWZsbGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDI1NjIsImV4cCI6MjA5NDI3ODU2Mn0.stmg2drDKVK55tDThqldjwuwVw6OPpQMLneOEjJoZCg",
};

window.HF_CONFIG = HF_CONFIG;
