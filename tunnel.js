const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
  try {
    console.log('Starting localtunnel on port 3000...');
    const tunnel = await localtunnel({ port: 3000 });

    console.log('Tunnel URL:', tunnel.url);
    fs.writeFileSync('tunnel_url.txt', tunnel.url + '\n', 'utf8');

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (err) {
    console.error('Error starting tunnel:', err);
    fs.writeFileSync('tunnel_error.txt', err.stack || err.message, 'utf8');
    process.exit(1);
  }
})();
