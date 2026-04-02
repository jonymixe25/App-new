import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';

function wait(ms){return new Promise(r=>setTimeout(r,ms));}

(async ()=>{
  console.log('Conectando broadcaster...');
  const broadcaster = io(URL);
  broadcaster.on('connect', ()=>console.log('broadcaster connected', broadcaster.id));
  broadcaster.on('watcher', (id)=>{
    console.log('broadcaster received watcher:', id);
  });
  broadcaster.on('viewers_count', c=>console.log('broadcaster viewers_count', c));
  broadcaster.on('chat_message', m=>console.log('broadcaster got chat_message', m));

  await wait(500);
  broadcaster.emit('broadcaster');

  console.log('Conectando watcher...');
  const watcher = io(URL);
  watcher.on('connect', ()=>console.log('watcher connected', watcher.id));
  watcher.on('chat_history', h=>console.log('watcher chat_history length', h.length));
  watcher.on('viewers_count', c=>console.log('watcher viewers_count', c));
  watcher.on('chat_message', m=>console.log('watcher chat_message', m));

  await wait(500);
  watcher.emit('watcher');

  await wait(500);
  console.log('Watcher enviando mensaje de chat...');
  watcher.emit('chat_message', { id: 'm1', from: 'watcher', text: 'Hola desde watcher', ts: Date.now() });

  await wait(500);
  console.log('Desconectando watcher...');
  watcher.disconnect();

  await wait(500);
  console.log('Reconectando watcher para comprobar historial...');
  const watcher2 = io(URL);
  watcher2.on('connect', ()=>console.log('watcher2 connected', watcher2.id));
  watcher2.on('chat_history', h=>console.log('watcher2 chat_history length', h.length));
  watcher2.on('viewers_count', c=>console.log('watcher2 viewers_count', c));
  await wait(500);
  watcher2.emit('watcher');

  await wait(1000);
  broadcaster.disconnect();
  watcher2.disconnect();
  console.log('Prueba finalizada.');
  process.exit(0);
})();
