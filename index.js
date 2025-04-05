// auth_backend_api/index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Updated with your backend config
const SUPABASE_URL = 'https://ohprjmgiurwjzovmzdbk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ocHJqbWdpdXJ3anpvdm16ZGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MTgyMDEsImV4cCI6MjA1OTM5NDIwMX0.l_uFzRrxOt0GV7kWtP7AwFTJT-ip1UVmFSCGB6ZfmOo';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1357900003145941203/NVNTaLLHonhLQHRncBtvzYaYVjVIPlaGW3ov1CPIQLijsC1_J0XenkqqD3JLSm1nmqij';
const VERIFY_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ocHJqbWdpdXJ3anpvdm16ZGJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzgxODIwMSwiZXhwIjoyMDU5Mzk0MjAxfQ.xOogm6qQVfBKzraRN3xl45dsjDUamQXuuOs99c2rUW8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from('users')
    .insert([{ username, password_hash: hash }]);

  if (error) return res.json({ success: false, error });

  await axios.post(WEBHOOK_URL, {
    content: `📥 New verification request\n**Username**: ${username}\nTo verify: https://render-gglf.onrender.com/verify?username=${username}&key=${VERIFY_SECRET}`
  });

  res.json({ success: true });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) return res.json({ verified: false });

  const valid = await bcrypt.compare(password, data.password_hash);

  if (!valid) return res.json({ verified: false });

  res.json({ verified: data.status === 'verified' });
});

app.get('/verify', async (req, res) => {
  const { username, key } = req.query;
  if (key !== VERIFY_SECRET) return res.status(403).send('Forbidden');

  const { error } = await supabase
    .from('users')
    .update({ status: 'verified' })
    .eq('username', username);

  if (error) return res.send('Verification failed.');
  res.send(`✅ ${username} is now verified.`);
});

app.listen(3000, () => console.log('API running on port 3000'));
