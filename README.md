# Guruvandanam
 
A full-stack web app with a React (Vite) client and a Node/Express backend.

## Structure

```
client/    React + Vite frontend
server/    Express API + SQLite (better-sqlite3)
```

## Prerequisites

- Node.js
- npm

## Setup

```bash
npm run install-all
```

Installs root, `client/`, and `server/` dependencies.

Copy `.env` files into `client/` and `server/` (not committed — see
`.gitignore`) with the variables below.

### server/.env

```
JWT_SECRET=
PORT=
HOST=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
APP_URL=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
CLOUDFRONT_DOMAIN=
```

### client/.env

```
VITE_RAZORPAY_KEY_ID=
```

## Development

```bash
npm run dev
```

Runs the client (Vite dev server) and server (Express) concurrently.

Individually:

```bash
npm run client   # client/ — vite dev server
npm run server   # server/ — node index.js
```

## Build

```bash
cd client && npm run build
```

Outputs to `client/dist`.

## Branding / site config

The site name, organizer name, competition dates, and registration fee are
centralized in **`shared/brand.json`** at the repo root — a plain JSON file
both the client (via `import`) and server (via `require`) read directly,
since JSON needs no ESM/CommonJS bridging. To rename the site, change the
competition dates, or update the registration fee, edit this one file.

Each side wraps it with values that must stay local to that side:

- **`client/src/lang.js`** — spreads `shared/brand.json` into an exported
  `BRAND` object, adding client-only display-format fields (Gujarati
  numerals, DMY date strings, etc.) alongside the existing `t` translation
  strings. All client pages import `BRAND` from here.
- **`server/config.js`** — spreads `shared/brand.json` into its exports
  (`BRAND_NAME`, `ORG_NAME`, `COMPETITION_START_DATE`, etc.) and adds
  server-only, env-driven values: `JWT_SECRET`, `ADMIN_EMAIL`, `APP_URL`.
  These are deliberately kept out of `shared/brand.json` — anything in that
  file gets bundled into the public client JS shipped to every browser, so
  secrets and env-driven config must never go there. Imported by
  `email.js`, `db.js`, `index.js`, and the `routes/*.js` files.

`client/index.html`'s `<title>` tag is a static HTML file Vite doesn't
template, so it's kept manually in sync (see the comment above it); the
actual browser tab title is set from `BRAND` at runtime in
`client/src/main.jsx`.

Not centralized (deliberately, since renaming them is a deploy-risk
operation, not a display change): the SQLite db filename (`aaradhna.db`),
the public logo/video asset filenames, and the npm `package.json` "name"
fields.

## Deployment

Two Claude Code agents under `.claude/agents/` automate deployment:

- **deploy** — builds `client/dist`, syncs it to an S3 bucket, and
  invalidates the CloudFront distribution.
- **backend-deploy** — SSHes into the remote app server, pulls latest
  code, installs backend dependencies, and restarts the service.

Both agents read their config from **`.env.deploy`** at the repo root —
copy `.env.deploy.example` to `.env.deploy` and fill in the AWS
credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`,
`S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`) and backend server details
(`SSH_HOST`, `SSH_USER`, `SSH_KEY_PATH`, `REMOTE_APP_DIR`,
`RESTART_COMMAND`). `.env.deploy` is gitignored and is used only by these
two agents — never by the running app.
