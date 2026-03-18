import app, { refreshLeads } from './app.js';

const PORT = 3001;

async function start() {
  console.log('Starting Workie Vids CRM server...');
  await refreshLeads();

  // Auto-refresh every 15 minutes
  setInterval(refreshLeads, 15 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`CRM server running on http://localhost:${PORT}`);
  });
}

start();
