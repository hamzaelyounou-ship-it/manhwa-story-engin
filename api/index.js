// api/index.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.json({ limit: '2mb' }));
app.use(cors());

const PORT = process.env.PORT || 3000;

// Server-side Supabase service role key - keep secret
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  console.log('Supabase client initialized on server');
} else {
  console.warn('Supabase service key or URL not provided; server will not persist generated content to DB.');
}

const SERVER_OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || null;
const SERVER_OPENAI_KEY = process.env.OPENAI_API_KEY || null;
const SERVER_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || null;

const MANHWA_SYSTEM_PROMPT = `
You are a creative story generation assistant specialized in manhwa/manga-style storytelling.
Produce: a hook, character list, 5-scene outline, and one fully written scene with panel cues.
Keep language vivid and cinematic for visual adaptation.
`;

function chooseProviderConfig(provider) {
  if (provider === 'openrouter') {
    return { url: 'https://openrouter.ai/api/v1/chat/completions', type: 'openrouter' };
  }
  if (provider === 'openai') {
    return { url: 'https://api.openai.com/v1/chat/completions', type: 'openai' };
  }
  if (provider === 'anthropic') {
    return { url: 'https://api.anthropic.com/v1/complete', type: 'anthropic' };
  }
  throw new Error('Unknown provider');
}

app.post('/api/generate', async (req, res) => {
  const { storyId, title, description, provider = 'openrouter', model, apiKey, extraPrompts } = req.body;

  try {
    // select key
    let headers = { 'Content-Type': 'application/json' };
    if (provider === 'openrouter') {
      const key = apiKey || SERVER_OPENROUTER_KEY;
      if (!key) return res.status(400).json({ error: 'OpenRouter API key missing' });
      headers.Authorization = `Bearer ${key}`;
    } else if (provider === 'openai') {
      const key = apiKey || SERVER_OPENAI_KEY;
      if (!key) return res.status(400).json({ error: 'OpenAI API key missing' });
      headers.Authorization = `Bearer ${key}`;
    } else if (provider === 'anthropic') {
      const key = apiKey || SERVER_ANTHROPIC_KEY;
      if (!key) return res.status(400).json({ error: 'Anthropic API key missing' });
      headers['x-api-key'] = key;
    }

    const pcfg = chooseProviderConfig(provider);

    const messages = [
      { role: 'system', content: MANHWA_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Create a manhwa-style story seed for:
Title: ${title}
Description: ${description || 'none'}
Story ID: ${storyId || 'no-id'}
Extra: ${extraPrompts || ''}
Provide: hook, character list, 5-scene outline, and one full scene with panel descriptions.`
      }
    ];

    const payload = {
      model: model,
      messages,
      temperature: 0.9,
      max_tokens: 1200
    };

    const response = await axios.post(pcfg.url, payload, { headers, timeout: 120000 });

    // attempt to persist to Supabase if configured
    if (supabase && storyId) {
      try {
        const contentToStore = {
          provider: provider,
          model: model,
          provider_raw: response.data
        };
        const { data, error } = await supabase
          .from('stories')
          .update({ content: contentToStore, status: 'done' })
          .eq('id', storyId)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
        } else {
          console.log('Supabase updated story', storyId);
        }
      } catch (e) {
        console.error('Error saving to supabase:', e.message || e);
      }
    } else {
      console.log('Skipping DB persist (no supabase client or missing storyId).');
    }

    return res.json({ ok: true, data: response.data });
  } catch (err) {
    console.error('Generation error:', err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'Generation failed', details: err.response ? err.response.data : err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
