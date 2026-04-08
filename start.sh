#!/bin/sh
set -e

# Start Tailscale daemon in the background (state persisted via Fly volume)
tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &

# Wait for tailscaled socket to be ready
for i in $(seq 1 10); do
  if [ -S /var/run/tailscale/tailscaled.sock ]; then
    break
  fi
  sleep 1
done

# Authenticate and join the tailnet
tailscale up --authkey="${TAILSCALE_AUTHKEY}" --hostname=health --accept-routes

echo "Tailscale is up, starting Caddy + Next.js..."

# Start Caddy (HTTPS reverse proxy with Netlify DNS challenge)
caddy run --config /app/Caddyfile &

# Start the Next.js app
exec node /app/server.js
