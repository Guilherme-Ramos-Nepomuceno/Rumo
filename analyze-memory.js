// Simple memory analysis script
setInterval(() => {
  const used = process.memoryUsage();
  console.log('=== MEMORY USAGE ===');
  console.log(`RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);
  console.log(`Heap Total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
  console.log(`Heap Used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  console.log(`External: ${Math.round(used.external / 1024 / 1024)}MB`);
  console.log(`Array Buffers: ${Math.round(used.arrayBuffers / 1024 / 1024)}MB`);
  console.log('==================');
}, 5000);
