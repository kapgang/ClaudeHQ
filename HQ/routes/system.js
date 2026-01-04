const express = require('express');
const os = require('os');
const { exec } = require('child_process');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    const cpuUsage = Math.round(100 - (totalIdle / totalTick * 100));

    // Get disk info (Windows)
    exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
      let diskInfo = { total: 0, free: 0, used: 0 };

      if (!error && stdout) {
        const lines = stdout.trim().split('\n').slice(1);
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3 && parts[1] && parts[2]) {
            diskInfo.free += parseInt(parts[1]) || 0;
            diskInfo.total += parseInt(parts[2]) || 0;
          }
        });
        diskInfo.used = diskInfo.total - diskInfo.free;
      }

      res.json({
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown'
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          percentage: Math.round((usedMem / totalMem) * 100)
        },
        disk: {
          total: diskInfo.total,
          used: diskInfo.used,
          free: diskInfo.free,
          percentage: diskInfo.total > 0 ? Math.round((diskInfo.used / diskInfo.total) * 100) : 0
        },
        uptime: os.uptime(),
        platform: os.platform(),
        hostname: os.hostname()
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
