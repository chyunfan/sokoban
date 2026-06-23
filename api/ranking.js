// api/ranking.js
// 从 Vercel KV 读取排行榜 Top10（文件型存储）
const { kv } = require('@vercel/kv');

const KV_KEY = 'sokoban_ranking';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const list = await kv.get(KV_KEY) || [];
    // 按分数降序、步数升序排序，取 Top10
    list.sort((a, b) => b.score - a.score || a.total_moves - b.total_moves);
    const top10 = list.slice(0, 10);
    res.status(200).json({ data: top10 });
  } catch (err) {
    console.error('ranking error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
