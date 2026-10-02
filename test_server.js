async function test() {
  console.log('1: express...');
  await import('express');
  console.log('2: config...');
  await import('./src/config/env.js');
  console.log('3: database...');
  await import('./src/config/database.js');
  console.log('4: User...');
  await import('./src/models/User.js'); 
  console.log('5: Message...');
  await import('./src/models/Message.js');
  console.log('6: routes...');
  await import('./src/routes/index.js');
  console.log('7: socketHandler...');
  await import('./src/socket/socketHandler.js');
  console.log('8: ALL IMPORTS SUCCESSFUL!');
  process.exit(0);
}
test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
