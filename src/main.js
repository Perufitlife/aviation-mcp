import { Actor } from 'apify';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOLS } from './tools.js';

await Actor.init();

const API_BASE = 'https://rotatepilot.com';

// Thin HTTP wrapper over the free Rotate Pilot aviation API (no key required).
async function fetchApi(path) {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) {
        const msg = (data && data.error) ? data.error : `${res.status} ${res.statusText}`;
        const hint = (data && data.hint) ? ` (${data.hint})` : '';
        throw new Error(`${msg}${hint}`);
    }
    return data;
}

function makeServer() {
    const server = new Server(
        { name: 'aviation-mcp', version: '1.0.0' },
        { capabilities: { tools: {} } },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: TOOLS.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
        })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (req) => {
        const { name, arguments: args } = req.params;
        const tool = TOOLS.find(t => t.name === name);
        if (!tool) {
            return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
        }
        try {
            const path = tool.buildPath(args || {});
            const data = await fetchApi(path);
            await Actor.charge({ eventName: 'tool-call' }).catch(() => {});
            return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
        }
    });

    return server;
}

const app = express();
app.use(express.json({ limit: '4mb' }));

const PORT = process.env.ACTOR_STANDBY_PORT || process.env.PORT || 4321;

// === Streamable HTTP transport (Claude Desktop, Cursor, ChatGPT, etc.) ===
const httpSessions = new Map();

app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    let transport;
    if (sessionId && httpSessions.has(sessionId)) {
        transport = httpSessions.get(sessionId);
    } else if (!sessionId && req.body?.method === 'initialize') {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => httpSessions.set(id, transport),
        });
        transport.onclose = () => {
            if (transport.sessionId) httpSessions.delete(transport.sessionId);
        };
        const server = makeServer();
        await server.connect(transport);
    } else {
        return res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: invalid session' },
            id: null,
        });
    }
    await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !httpSessions.has(sessionId)) return res.status(400).send('Invalid or missing session ID');
    await httpSessions.get(sessionId).handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !httpSessions.has(sessionId)) return res.status(400).send('Invalid or missing session ID');
    await httpSessions.get(sessionId).handleRequest(req, res);
});

// === Legacy SSE transport ===
const sseTransports = new Map();

app.get('/sse', async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    sseTransports.set(transport.sessionId, transport);
    // Keepalive: the standby gateway drops connections with no first byte ~60s.
    const keepalive = setInterval(() => {
        res.write(': keepalive\n\n');
    }, 10000);
    res.on('close', () => { clearInterval(keepalive); sseTransports.delete(transport.sessionId); });
    const server = makeServer();
    await server.connect(transport);
});

app.post('/messages', async (req, res) => {
    const transport = sseTransports.get(req.query.sessionId);
    if (!transport) return res.status(404).send('Session not found');
    await transport.handlePostMessage(req, res);
});

// === Smithery well-known server card ===
app.get('/.well-known/mcp/server-card.json', (req, res) => {
    res.json({
        name: 'aviation-mcp',
        version: '1.0.0',
        description: 'MCP server giving AI agents live aviation data: decoded METAR weather, airport info by ICAO, aircraft specs, an aviation glossary, FAA-style practice questions, and a daily pilot quiz. Powered by the free Rotate Pilot API.',
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
    });
});

// === Info / health endpoint ===
app.get('/', (req, res) => {
    res.json({
        name: 'aviation-mcp',
        version: '1.0.0',
        description: 'Live aviation data tools for AI agents (METAR, airports, aircraft, glossary, FAA questions, daily quiz). Powered by Rotate Pilot.',
        tools: TOOLS.map(t => t.name),
        toolCount: TOOLS.length,
        endpoints: { mcp_streamable_http: '/mcp', mcp_sse_legacy: '/sse', health: '/' },
        dataSource: 'https://rotatepilot.com/developers',
        protocolVersion: '2025-06-18',
    });
});

app.listen(PORT, () => {
    console.log(`Aviation MCP server listening on port ${PORT}`);
    console.log(`Tools: ${TOOLS.map(t => t.name).join(', ')}`);
});
