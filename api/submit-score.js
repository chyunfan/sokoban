// pages/api/submit-score.js
// 提交推箱子游戏分数（upsert，同一openid只保留最高分）
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // 查询已有记录，只在高分时更新
    const { data: existing } = await supabase
      .from('sokoban_scores')
      .select('score, levels_cleared')
      .eq('openid', openid)
      .single();

    const newScore = Number(score) || 0;
    const newLevels = Number(levels_cleared) || 0;
    const newMoves = Number(total_moves) || 0;

    // 已有记录且新分数更低，不更新
    if (existing && existing.score > newScore) {
      return res.status(200).json({ success: true, updated: false, message: '已有更高分记录' });
    }

    const { error } = await supabase
      .from('sokoban_scores')
      .upsert({
        openid,
        nickname: nickname.substring(0, 20),
        score: newScore,
        levels_cleared: newLevels,
        total_moves: newMoves,
        updated_at: new Date().toISOString()
      }, { onConflict: 'openid' });

    if (error) {
      console.error('Upsert error:', error);
      return res.status(500).json({ error: '数据库写入失败' });
    }

    res.status(200).json({ success: true, updated: true });
  } catch (err) {
    console.error('submit-score error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
