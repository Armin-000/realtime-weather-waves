# Oceanis production deployment

Oceanis is a static Vite application. `node_modules` is required only while building the project; it is not required to serve the finished site.

## Recommended production flow

```bash
npm ci
npm run build
```

Publish only the generated `dist/` directory with a static web server/CDN (Apache, Nginx, Cloudflare Pages, Vercel static output, Netlify, etc.). Do not run `vite`, `vite preview`, or keep `node_modules` as the production runtime unless the hosting platform specifically requires it for its build phase.

For long-lived static assets, configure the server/CDN to cache hashed files under `dist/assets/` aggressively. HTML should use a shorter cache policy so new deployments become visible quickly.
