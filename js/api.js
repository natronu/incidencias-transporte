    // ================================================================
    // SUPABASE CONFIG
    // ================================================================
    const SUPABASE_URL = 'https://rldzhfsordgniatkhxgs.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_bwXX7sv_qVJYl6ZetjGRcQ_MaikOdht';

    function getAuthToken() {
      return sessionStorage.getItem('sb_access_token') || SUPABASE_KEY;
    }

    const sb = {
      async query(table, params = '') {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' }
        });
        if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.statusText); }
        return r.json();
      },
      async insert(table, data) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.statusText); }
        return r.json();
      },
      async update(table, id, data) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify(data)
        });
        if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.statusText); }
        return r.json();
      },
      async delete(table, id) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${getAuthToken()}` }
        });
        if (!r.ok) { const e = await r.json(); throw new Error(e.message || r.statusText); }
        return true;
      },
      async count(table, params = '') {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
          method: 'HEAD',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${getAuthToken()}`, 'Prefer': 'count=exact' }
        });
        if (!r.ok) throw new Error(r.statusText);
        const range = r.headers.get('Content-Range');
        return range ? parseInt(range.split('/')[1], 10) : 0;
      }
    };
