// https://github.com/libp2p/js-libp2p/blob/main/doc/GETTING_STARTED.md
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
//import { bootstrap } from '@libp2p/bootstrap'
import { mdns } from '@libp2p/mdns' //Multicast DNS

//env DEBUG="libp2p:tcp,libp2p:websockets,libp2p:webtransport,libp2p:kad-dht,libp2p:dialer"

const port = Number(process.argv[2]) || 8000;

(async() => {

const node = await createLibp2p({
  start: false,
  addresses: {
    listen: [`/ip4/0.0.0.0/tcp/${port}/ws`]
  },
  transports: [
    webSockets()
  ],
  connectionEncryption: [noise()],
  streamMuxers: [yamux()],
  peerDiscovery: [
    /*
      di connette in automatico a tutti i nodi che trova nella stessa rete locale!
      mDNS (Multicast DNS) è un protocollo utilizzato per la risoluzione dei nomi di host
      su reti locali senza la necessità di un server DNS configurato centralmente.
      È una componente chiave di Zero-configuration Networking (zeroconf),
      che permette ai dispositivi di scoprire servizi e dispositivi in rete locale
      automaticamente. mDNS viene spesso utilizzato in congiunzione con
      DNS Service Discovery (DNS-SD).
    */
    mdns({
      interval: 1000
    })
  ]
});

node.addEventListener('peer:discovery', e => {
  console.log('New peer Discovered', e.detail)
})

node.addEventListener('peer:connect', e => {
  console.log('Connected to peer:', e.detail)
})

await node.start()

const listenAddrs = node.getMultiaddrs();
console.log('node listen: ', listenAddrs)


process.on('SIGINT', async () => {
  console.log('node stopping...');
  await node.stop()
  process.exit(0);
});

})();