// api/submit-score.js
// 提交分数到 Vercel KV（文件型存储）
const { kv } = require('@vercel/kv');

const KV_KEY = 'sokoban_ranking';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { openid, nickname, score, levels_cleared, total_moves } = req.body;
    if (!openid || !nickname) {
      return res.status(400).json({ error: 'openid and nickname are required' });
    }

    // 从 KV 读取排行数据
    let list = await kv.get(KV_KEY) || [];

    // 查找已有记录，只保留更高分
    const idx = list.findIndex(r => r.openid === openid);
    const newScore = Number(score) || 0;
    if (idx >= 0 && list[idx].score >= newScore) {
      return res.status(200).json({ success: true, updated: false });
    }

    const entry = {
      openid,
      nickname: nickname.substring(0, 20),
      score: newScore,
      levels_cleared: Number(levels_cleared) || 0,
      total_moves: Number(total_moves) || 0
    };

    if (idx >= 0) {
      list[idx] = entry;
    } else {
      list.push(entry);
    }

    // 写回 KV
    await kv.set(KV_KEY, list);
    res.status(200).json({ success: true, updated: true });
  } catch (err) {
    console.error('submit-score error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
