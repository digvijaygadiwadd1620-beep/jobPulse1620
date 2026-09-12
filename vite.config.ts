import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const devHmrPlugin = (): Plugin => ({
  name: 'dev-hmr-handler',
  apply: 'serve',
  transformIndexHtml() {
    return [
      {
        tag: 'script',
        injectTo: 'head-prepend',
        children: `
          (function() {
            if (typeof window === 'undefined') return;
            window.addEventListener('unhandledrejection', function(e) {
              var m = (e && e.reason && (e.reason.message || e.reason.stack)) || String((e && e.reason) || '');
              if (m.indexOf('WebSocket') !== -1 || m.indexOf('websocket') !== -1) {
                e.preventDefault();
                e.stopImmediatePropagation();
              }
            }, true);
            window.addEventListener('error', function(e) {
              var m = (e && (e.message || (e.error && e.error.message))) || '';
              if (m.indexOf('WebSocket') !== -1 || m.indexOf('websocket') !== -1) {
                e.preventDefault();
                e.stopImmediatePropagation();
              }
            }, true);
            var WS = window.WebSocket;
            if (WS) {
              window.WebSocket = function(url, proto) {
                if (proto === 'vite-hmr' || (typeof url === 'string' && url.indexOf('vite-hmr') !== -1)) {
                  var t = new EventTarget();
                  t.readyState = 1;
                  t.send = function() {};
                  t.close = function() {};
                  setTimeout(function() {
                    t.dispatchEvent(new Event('open'));
                  }, 0);
                  return t;
                }
                return new WS(url, proto);
              };
              window.WebSocket.prototype = WS.prototype;
              window.WebSocket.OPEN = WS.OPEN;
              window.WebSocket.CLOSED = WS.CLOSED;
              window.WebSocket.CLOSING = WS.CLOSING;
              window.WebSocket.CONNECTING = WS.CONNECTING;
            }
          })();
        `,
      },
    ];
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), devHmrPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
