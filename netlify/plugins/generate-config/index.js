module.exports = {
  onPreBuild: ({ utils }) => {
    const fs = require('fs');
    const config = `const HF_CONFIG = {
  SUPABASE_URL: '${process.env.SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY}',
};`;
    fs.writeFileSync('js/config.js', config);
  }
};