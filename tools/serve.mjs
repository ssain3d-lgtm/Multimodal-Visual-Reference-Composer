#!/usr/bin/env node
/**
 * A static file server for the app, with no dependencies.
 *
 * The app is plain ES modules, which browsers refuse to load over `file://`, so
 * something has to serve it. This exists so that starting the app needs nothing
 * but Node — no Python, no npm install — and so the Windows launcher can stay a
 * handful of lines.
 *
 *   node tools/serve.mjs              serve on the first free port from 8765
 *   node tools/serve.mjs --open       …and open a browser at the app
 *   node tools/serve.mjs --port 9000  …on a specific port
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = '/app/index.html'

const args = process.argv.slice(2)
const has = (flag) => args.includes(flag)
const valueOf = (flag, fallback) => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const START_PORT = Number(valueOf('--port', process.env.PORT || 8765))
const MAX_TRIES = 20

// A wrong Content-Type on a module is fatal: the browser refuses to execute it
// and the page dies with a bare MIME error, so this list is deliberately explicit.
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

const server = http.createServer((req, res) => {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    res.writeHead(400).end('Bad request')
    return
  }
  if (pathname === '/') pathname = ENTRY

  // Resolve, then confirm the result is still inside the repository. Without this
  // check a request for /../../etc/passwd would be served.
  const target = path.resolve(ROOT, '.' + pathname)
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden')
    return
  }

  fs.stat(target, (err, stat) => {
    if (err || stat.isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(`Not found: ${pathname}\n\nThe app lives at ${ENTRY}`)
      return
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': 'no-cache',
    })
    fs.createReadStream(target).pipe(res).on('error', () => res.destroy())
  })
})

/** Open the default browser, quietly doing nothing if the platform has no opener. */
function openBrowser(url) {
  const [cmd, cmdArgs] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]]
      : ['xdg-open', [url]]
  try {
    spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
  } catch { /* no browser to open; the URL is printed either way */ }
}

// Take the first free port, so a second copy of the app does not fail to start.
//
// The handlers are registered ONCE, not per attempt. `server.listen(port, cb)`
// registers cb as a one-shot 'listening' listener, and a failed attempt does not
// remove it — so retrying with a fresh callback made every earlier callback fire
// on success too, printing a banner for a port nothing was bound to. The bound
// port is read back from the socket instead of trusted from the variable.
let port = START_PORT
let attempt = 0

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && attempt < MAX_TRIES) {
    attempt += 1
    port += 1
    server.listen(port, '127.0.0.1')
    return
  }
  console.error(`Could not start the server: ${err.message}`)
  process.exit(1)
})

server.on('listening', () => {
  const url = `http://localhost:${server.address().port}${ENTRY}`
  console.log('')
  console.log('  Unified Visual Reference Composer')
  console.log(`  ${url}`)
  console.log('')
  console.log('  Press Ctrl+C to stop.')
  console.log('')
  if (has('--open')) openBrowser(url)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 500) })
}

server.listen(port, '127.0.0.1')
