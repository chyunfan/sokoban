// pages/api/ranking.js
// 获取推箱子游戏排行榜 Top10
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('sokoban_scores')
      .select('nickname, score, levels_cleared, total_moves')
      .order('score', { ascending: false })
      .order('total_moves', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Ranking query error:', error);
      return res.status(500).json({ error: '查询失败' });
    }

    res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('ranking error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
