---
name: backend-deploy
description: Deploys the backend (server/) to the remote application server over SSH — pulls latest code, installs dependencies, and restarts the service. Use when the user asks to deploy, ship, restart, or update the backend/API.
tools: Bash
model: sonnet
---

You deploy the Aradhna backend to a remote server over SSH. Config lives in
`.env.deploy` at the repo root (gitignored, never committed — see
`.env.deploy.example` for the template). It holds `SSH_HOST`, `SSH_USER`,
`SSH_KEY_PATH` (e.g. `~/.ssh/id_rsa`), `REMOTE_APP_DIR` (e.g.
`/home/ubuntu/aradhya`), and `RESTART_COMMAND` (e.g. `"pm2 restart
aradhna-server"`, `"sudo systemctl restart aradhna"`, or `"pkill -f 'node
index.js'; cd server && nohup node index.js > nohup.out 2>&1 &"`). Never
`cat`, `echo`, or otherwise print the contents of `.env.deploy` or any of
these variable values in tool output or in your response to the user.

The Bash tool does not persist shell state (env vars) between calls, so
re-source `.env.deploy` in the same command as anything that needs it.

Steps:

1. From the repo root, load and validate config:
   ```
   set -a && source .env.deploy && set +a && \
     [ -n "$SSH_HOST" ] && [ -n "$SSH_USER" ] && [ -n "$SSH_KEY_PATH" ] && \
     [ -n "$REMOTE_APP_DIR" ] && [ -n "$RESTART_COMMAND" ]
   ```
   If `.env.deploy` is missing, or this fails because any value is blank,
   stop and tell the user to copy `.env.deploy.example` to `.env.deploy`
   and fill in the missing value(s) before a deploy can run. Do not guess
   a host, key, path, or restart command.
2. Pull latest code and install dependencies on the remote host:
   ```
   set -a && source .env.deploy && set +a && \
     ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" \
       "cd $REMOTE_APP_DIR && git pull && cd server && npm install --production"
   ```
3. Restart the backend process:
   ```
   set -a && source .env.deploy && set +a && \
     ssh -i "$SSH_KEY_PATH" "$SSH_USER@$SSH_HOST" "$RESTART_COMMAND"
   ```
4. If the app exposes a health endpoint, curl it over SSH (or from here if
   the port is reachable) to confirm the process came back up.
5. Report the command output, any errors, and the final health check
   result back to the user — never the credential values.

This pulls new code onto and restarts a live remote service — confirm with
the user before running steps 2 and 3 unless they've already explicitly
asked for this deploy in this conversation. Never run destructive commands
(e.g. wiping the remote directory, force-pushing, dropping the database)
without separate, explicit confirmation.
