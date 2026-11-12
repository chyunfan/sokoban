// /api/submit-score —— 提交分数，同一 openid 只保留更高分
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SERVICE_KEY
  || process.env.SUPABASE_ANON_KEY
  || process.env.SUPABASE_PUBLISHABLE_KEY
  || process.env.SUPABASE_KEY;
const TABLE = 'sokoban_scores';

const num = v => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!SUPA || !KEY) {
    return res.status(200).json({ success: false, error: '未配置 SUPABASE_URL / SUPABASE_KEY 环境变量' });
  }

  const body = req.body || {};
  const openid = String(body.openid || '').trim().slice(0, 64);
  const nickname = String(body.nickname || '').trim().slice(0, 20) || '匿名玩家';
  const score = num(body.score);
  const levels = num(body.levels_cleared);
  const moves = num(body.total_moves);
  if (!openid) return res.status(400).json({ error: 'openid 不能为空' });

  const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

  try {
    // 1. 查该玩家历史最高分
    const q = `${SUPA}/rest/v1/${TABLE}?openid=eq.${encodeURIComponent(openid)}&select=score`;
    const qr = await fetch(q, { headers });
    if (!qr.ok) {
      const t = await qr.text();
      console.error('submit read failed', qr.status, t.slice(0, 300));
      return res.status(500).json({ error: `读取失败 ${qr.status}（表 sokoban_scores 是否已建？）` });
    }
    const rows = await qr.json();
    const best = Array.isArray(rows) && rows.length ? Number(rows[0].score) || 0 : -1;
    if (best >= score) return res.status(200).json({ success: true, updated: false, best });

    // 2. UPSERT（主键 openid）
    const up = await fetch(`${SUPA}/rest/v1/${TABLE}?on_conflict=openid`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal,resolution=merge-duplicates'
      },
      body: JSON.stringify([{
        openid, nickname, score,
        levels_cleared: levels,
        total_moves: moves,
        updated_at: new Date().toISOString()
      }])
    });
    if (!up.ok && up.status !== 201 && up.status !== 204) {
      const t = await up.text();
      console.error('submit upsert failed', up.status, t.slice(0, 300));
      return res.status(500).json({ error: `写入失败 ${up.status}` });
    }
    return res.status(200).json({ success: true, updated: true, best: score });
  } catch (e) {
    console.error('submit-score error', e);
    return res.status(500).json({ error: e.message });
  }
};
