// https://github.com/libp2p/js-libp2p/blob/main/doc/GETTING_STARTED.md
import { createLibp2p } from 'libp2p'
//import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mdns } from '@libp2p/mdns' //Multicast DNS

import { tcp } from '@libp2p/tcp' //Multicast DNS

import { identify } from '@libp2p/identify' //necessario per far funzionare pubsub
import { floodsub } from '@libp2p/floodsub'

import { stdin }  from 'node:process'

//env DEBUG="libp2p:tcp,libp2p:websockets,libp2p:webtransport,libp2p:kad-dht,libp2p:dialer"

const port = Number(process.argv[2]) || 8000;
const msg = process.argv[3] || '';

(async() => {

const libp2p = await createLibp2p({
  start: false,
  addresses: {
    listen: [`/ip4/0.0.0.0/tcp/${port}`]
  },
  transports: [
    tcp()
  ],
  services: {
    identify: identify(),
    pubsub: floodsub()
  },
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  peerDiscovery: [
    mdns({
      interval: 1000
    })
  ]
});

libp2p.addEventListener('peer:discovery', e => {
  console.log('Discovered:', e.detail.multiaddrs.toString() )
});

libp2p.addEventListener('peer:connect', e => {
  console.log('Connected:', e.detail)
})

await libp2p.start()

const listenAddrs = libp2p.getMultiaddrs();
console.log('libp2p listen: ', listenAddrs)

const topic = 'pubsub_topic';

console.log('Subscribe:', topic);
libp2p.services.pubsub.subscribe(topic);


libp2p.services.pubsub.addEventListener('message', msg => {
  console.log(`Message:`, new TextDecoder().decode(msg.detail.data))
})

console.log('Type a message to send it to all peers:')
stdin.on('data', data => {

  const msg = data.toString().trim()
      , msgBin = Buffer.from(`"${msg}"`);

  libp2p.services.pubsub.publish(topic, msgBin);
});

process.on('SIGINT', async () => {
  console.log('libp2p stopping...');
  await libp2p.stop()
  process.exit(0);
});

})();