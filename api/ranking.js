// /api/ranking —— 读取排行榜 Top10
// 服务端函数，密钥只存在 Vercel 环境变量里，前端拿不到
const SUPA = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SERVICE_KEY
  || process.env.SUPABASE_ANON_KEY
  || process.env.SUPABASE_PUBLISHABLE_KEY
  || process.env.SUPABASE_KEY;
const TABLE = 'sokoban_scores';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed', data: [] });

  if (!SUPA || !KEY) {
    return res.status(200).json({ data: [], error: '未配置 SUPABASE_URL / SUPABASE_KEY 环境变量' });
  }

  try {
    const url = `${SUPA}/rest/v1/${TABLE}` +
      '?select=openid,nickname,score,levels_cleared,total_moves' +
      '&order=score.desc,total_moves.asc&limit=10';
    const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    if (!r.ok) {
      const t = await r.text();
      console.error('ranking read failed', r.status, t.slice(0, 300));
      return res.status(500).json({ data: [], error: `读取失败 ${r.status}（表 sokoban_scores 是否已建？）` });
    }
    const data = await r.json();
    return res.status(200).json({ data: Array.isArray(data) ? data : [] });
  } catch (e) {
    console.error('ranking error', e);
    return res.status(500).json({ data: [], error: e.message });
  }
};
