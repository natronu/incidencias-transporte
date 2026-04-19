import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiter en memoria — 5 intentos por IP cada 15 minutos
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX = 5, WINDOW = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const r = attempts.get(ip);
  if (!r || now > r.resetAt) { attempts.set(ip, { count: 1, resetAt: now + WINDOW }); return false; }
  if (r.count >= MAX) return true;
  r.count++;
  return false;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  let username: string, password: string;
  try {
    const body = await req.json();
    username = body.username?.trim();
    password = body.password;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!username || !password) return new Response(JSON.stringify({ error: 'username and password required' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (isRateLimited(ip)) return new Response(JSON.stringify({ error: 'Demasiados intentos. Espera 15 minutos.' }), {
    status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  // Hash idéntico al almacenado en la BD (SHA-256 + salt estático de la app)
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode('translog_v1::' + password));
  const hashed = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Service role key está en vars de entorno de Supabase — nunca expuesta al cliente
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false }
  });

  const { data: users, error: dbError } = await supabase
    .from('app_users')
    .select('id, name, role, password_hash')
    .eq('username', username)
    .eq('active', true)
    .limit(1);

  if (dbError) {
    console.error('DB error:', dbError.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!users?.length || users[0].password_hash !== hashed) {
    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const user = users[0];
  const jwtSecret = Deno.env.get('APP_JWT_SECRET')!;
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );

  const now = getNumericDate(0);
  const access_token = await create({ alg: 'HS256', typ: 'JWT' }, {
    sub: String(user.id),
    role: 'authenticated',    // requerido por RLS de Supabase
    app_role: user.role,      // 'admin' | 'user' — usado en políticas RLS
    user_name: user.name,
    iat: now,
    exp: getNumericDate(60 * 60 * 8), // sesión de 8 horas
  }, cryptoKey);

  return new Response(
    JSON.stringify({ access_token, user: { id: user.id, name: user.name, role: user.role } }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
