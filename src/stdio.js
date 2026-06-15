#!/usr/bin/env node
/**
 * Standalone stdio entrypoint for the Aviation MCP.
 *
 * Runs the same 6 aviation tools over stdio with NO Apify platform dependency, so
 * any MCP client can start it with `npx @renzom13/aviation-mcp` and Glama can
 * introspect the tool definitions for its quality score. Data still comes from the
 * free, public Rotate Pilot API (no key). The hosted, pay-per-call version remains
 * on Apify for zero-setup / production use.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOLS } from './tools.js';

const API_BASE = 'https://rotatepilot.com';

async function fetchApi(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
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
        const data = await fetchApi(tool.buildPath(args || {}));
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    } catch (e) {
        return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Aviation MCP (stdio) ready — 6 tools, data via rotatepilot.com');
