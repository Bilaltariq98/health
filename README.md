# Gym Tracker

A personal health & gym tracking app built with Next.js, Drizzle ORM, and libSQL.

## Local Development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

App runs at http://localhost:3000.

## Deployment

Deployed on [Fly.io](https://fly.io) behind [Tailscale](https://tailscale.com) (no public internet exposure). HTTPS is handled by [Caddy](https://caddyserver.com) using the Let's Encrypt DNS challenge.

### Architecture

```
Internet ──✗──(no public ports)

Tailscale tailnet:
  Browser (on tailnet) ──► health.example.com
    ──► Tailscale IP (100.x.x.x)
    ──► Caddy (TLS termination, port 443)
    ──► Next.js (port 80)
```

**Why this setup?**

- **Tailscale** — the app is only accessible from devices on your tailnet. No public attack surface.
- **Caddy + DNS challenge** — since there are no public ports, Caddy can't use the standard HTTP challenge for Let's Encrypt. Instead, it proves domain ownership via DNS records using an API token from your DNS provider (e.g. Netlify, Cloudflare).
- **Fly volume** — Tailscale state is persisted to a Fly volume at `/var/lib/tailscale`. Without this, every deploy registers a new Tailscale node (health, health-1, health-2, etc.) because the container starts fresh each time.

### Setup

1. **DNS record** — point your domain (e.g. `health.example.com`) to the container's Tailscale IP with an A record. You can find the IP with `tailscale ip -4` or in the Tailscale admin console.

2. **Create a Fly volume** for Tailscale state persistence:

   ```bash
   fly volumes create tailscale_state --region lhr --size 1
   ```

3. **Set secrets** on Fly:

   ```bash
   fly secrets set TAILSCALE_AUTHKEY=tskey-auth-...
   fly secrets set NETLIFY_TOKEN=<netlify-personal-access-token>
   ```

   - Tailscale auth key: generate at https://login.tailscale.com/admin/settings/keys (enable "Reusable" and "Ephemeral")
   - Netlify token: generate at https://app.netlify.com/user/applications#personal-access-tokens
   - If using a different DNS provider, swap the Caddy DNS plugin in the Dockerfile and update the Caddyfile accordingly.

4. **Update the Caddyfile** with your domain:

   ```
   health.example.com {
       reverse_proxy localhost:80
       tls {
           dns netlify {env.NETLIFY_TOKEN}
       }
   }
   ```

5. **Deploy:**

   ```bash
   fly deploy
   ```

### Environment Variables

See `.env.example` for app-level variables. Fly secrets handle:

| Secret             | Purpose                          |
| ------------------ | -------------------------------- |
| `TAILSCALE_AUTHKEY`| Joins the container to your tailnet |
| `NETLIFY_TOKEN`    | DNS challenge for TLS certs      |
| `TURSO_DATABASE_URL` | Production database URL (Turso) |
| `TURSO_AUTH_TOKEN`   | Production database auth token  |
