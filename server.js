import express from 'express';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get('/', (req, res) => {
  res.json({ status: 'FFmpeg server is running!' });
});

app.post('/render', async (req, res) => {
  try {
    const { jobId, clips, transitions, audioUrl } = req.body;
    console.log(`📹 Rendering job ${jobId} with ${clips.length} clips`);
    
    await supabase
      .from('export_jobs')
      .update({ status: 'processing', progress: 10 })
      .eq('id', jobId);

    // Simulate rendering (replace with actual FFmpeg later)
    let progress = 10;
    for (let i = 0; i < 10; i++) {
      progress += 9;
      await supabase
        .from('export_jobs')
        .update({ progress: Math.min(progress, 95) })
        .eq('id', jobId);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const videoUrl = `https://your-bucket.r2.dev/exports/${jobId}.mp4`;

    await supabase
      .from('export_jobs')
      .update({
        status: 'complete',
        progress: 100,
        video_url: videoUrl,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    await supabase
      .from('notifications')
      .insert({
        user_id: req.body.userId,
        type: 'export_complete',
        message: '✅ Your video is ready to post!',
        data: { jobId, videoUrl },
      });

    res.json({ success: true, videoUrl });

  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎬 FFmpeg server running on port ${PORT}`);
});