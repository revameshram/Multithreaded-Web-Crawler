import { Client } from '@stomp/stompjs';

export function connectToCrawl(jobId, onEvent) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env.VITE_WS_HOST || (window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host);
  const brokerURL = `${wsProtocol}//${wsHost}/ws`;

  const client = new Client({
    brokerURL,
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe(`/topic/crawls/${jobId}`, (message) => {
        try {
          onEvent(JSON.parse(message.body));
        } catch (error) {
          console.error('Failed to parse crawl event', error);
        }
      });
    },
    onStompError: (frame) => {
      console.error('Broker error', frame.headers.message);
    },
  });

  client.activate();
  return () => client.deactivate();
}
