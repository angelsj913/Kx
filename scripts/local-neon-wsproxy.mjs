#!/usr/bin/env node
/**
 * Local-development WebSocket ⇄ TCP bridge for the Neon serverless driver.
 *
 * The app talks to Postgres through @neondatabase/serverless, which (with the
 * default config used in src/lib/prisma.ts) opens a *secure* WebSocket to
 * `wss://<host>/v2` and tunnels the raw Postgres wire protocol over it. In
 * production that host is a real Neon endpoint. For local development this tiny
 * proxy plays the role of Neon's `wsproxy`: it terminates the wss connection and
 * pipes the bytes straight to a plain local Postgres over TCP.
 *
 * This is dev-only tooling — it is NOT used in production and does not touch the
 * application code. See AGENTS.md ("Cursor Cloud specific instructions").
 *
 * Env:
 *   WSPROXY_PORT       WebSocket listen port (default 443 — Neon uses wss/443)
 *   PGPROXY_HOST       backend Postgres host (default 127.0.0.1)
 *   PGPROXY_PORT       backend Postgres port (default 5432)
 *   WSPROXY_CERT_DIR   where the self-signed cert is generated/read
 *                      (default <repo>/.local-neon)
 */
import { WebSocketServer } from "ws";
import https from "node:https";
import net from "node:net";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.WSPROXY_PORT || 443);
const PG_HOST = process.env.PGPROXY_HOST || "127.0.0.1";
const PG_PORT = Number(process.env.PGPROXY_PORT || 5432);

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const certDir = process.env.WSPROXY_CERT_DIR || resolve(repoRoot, ".local-neon");
const keyPath = resolve(certDir, "key.pem");
const certPath = resolve(certDir, "cert.pem");

function ensureCert() {
  if (existsSync(keyPath) && existsSync(certPath)) return;
  mkdirSync(certDir, { recursive: true });
  execFileSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes",
      "-keyout", keyPath, "-out", certPath, "-days", "3650",
      "-subj", "/CN=localhost",
      "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
    ],
    { stdio: "ignore" },
  );
  console.log(`[wsproxy] generated self-signed cert in ${certDir}`);
}

ensureCert();

const server = https.createServer({
  key: readFileSync(keyPath),
  cert: readFileSync(certPath),
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const socket = net.connect(PG_PORT, PG_HOST);
  let open = true;

  socket.on("data", (chunk) => {
    if (ws.readyState === ws.OPEN) ws.send(chunk);
  });
  ws.on("message", (data) => {
    if (open) socket.write(data);
  });

  const shutdown = () => {
    open = false;
    try { socket.end(); } catch {}
    try { ws.close(); } catch {}
  };
  ws.on("close", shutdown);
  ws.on("error", shutdown);
  socket.on("close", shutdown);
  socket.on("error", (err) => {
    console.error("[wsproxy] pg socket error:", err.message);
    shutdown();
  });
});

server.listen(PORT, () => {
  console.log(`[wsproxy] wss://0.0.0.0:${PORT}  ->  postgres ${PG_HOST}:${PG_PORT}`);
});
