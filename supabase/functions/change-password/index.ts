import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const jwtSecret = Deno.env.get('APP_JWT_SECRET')!;
  const encoder = new TextEncoder();

  let userId: number;
  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', encoder.encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const payload = await verify(authHeader.slice(7), cryptoKey) as { sub: string };
    userId = parseInt(payload.sub);
    if (!userId || isNaN(userId)) throw new Error('Invalid sub');
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let currentPassword: string, newPassword: string;
  try {
    const body = await req.json();
    currentPassword = body.currentPassword;
    newPassword = body.newPassword;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (!currentPassword || !newPassword) {
    return new Response(JSON.stringify({ error: 'currentPassword y newPassword son obligatorios' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (newPassword.length < 8) {
    return new Response(JSON.stringify({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const hashPwd = async (plain: string) => {
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode('translog_v1::' + plain));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false }
  });

  const { data: users, error: dbError } = await supabase
    .from('app_users')
    .select('id, password_hash')
    .eq('id', userId)
    .eq('active', true)
    .limit(1);

  if (dbError || !users?.length) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (users[0].password_hash !== await hashPwd(currentPassword)) {
    return new Response(JSON.stringify({ error: 'Contraseña actual incorrecta' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { error: updateError } = await supabase
    .from('app_users')
    .update({ password_hash: await hashPwd(newPassword) })
    .eq('id', userId);

  if (updateError) {
    console.error('Update error:', updateError.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
