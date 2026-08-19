# Local preview

## Reproduce uncommitted artifacts

- No environment files or generated runtime artifacts need to be copied for this worktree.
- Install dependencies with `npm install` if `node_modules` is absent or dependencies have changed.

## Run the server

- Start Astro with `npm run dev` from the repository root.
- Astro uses port `4321` by default. If it is unavailable, provide an open port with `npm run dev -- --port <port>`.
- For a detached Windows preview process, use `Start-Process` with `npm.cmd`, redirect standard output and error to separate files, and record the returned process id.
