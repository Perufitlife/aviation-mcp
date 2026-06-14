# Aviation MCP Server ✈️

Give your AI agent **live aviation data**. Connect this MCP server to Claude Desktop, ChatGPT, Cursor, Cline, Continue, or Windsurf and your assistant can pull real METAR weather, airport info, aircraft specs, an aviation glossary, and FAA-style practice questions — on demand.

Powered by the free [Rotate Pilot](https://rotatepilot.com/developers) aviation API. **No API keys to wrangle, no signup** — just connect and go.

## Tools (6)

| Tool | What it does |
|------|--------------|
| `get_metar` | Current decoded METAR for any ICAO airport — flight category (VFR/MVFR/IFR/LIFR), wind, visibility, temp, dewpoint. Optional TAF. |
| `get_airport` | Airport info by ICAO — name, IATA, city, country, coordinates, elevation, runways. |
| `get_aircraft` | Aircraft specs by slug — engines, seats, range, cruise, ceiling, MTOW, type rating. |
| `get_glossary_term` | Definition of an aviation term (e.g. `squawk`, `v-speeds`) with related terms. |
| `practice_questions` | FAA-style practice exam questions with options + correct answer. Filter by subject. |
| `quiz_of_the_day` | The aviation question of the day. |

## Example prompts

- "What's the current weather at KJFK and is it VFR?"
- "Pull the specs for a Cessna 172 and a Piper Warrior and compare cruise speed and range."
- "Give me 3 FAA meteorology practice questions and quiz me."
- "What does the squawk code 7700 mean?"

## Connect it

This runs as an Apify **Standby Actor** that speaks MCP over Streamable HTTP. Add it to your client config:

```json
{
  "mcpServers": {
    "aviation": {
      "url": "https://renzomacar--aviation-mcp.apify.actor/mcp?token=YOUR_APIFY_TOKEN"
    }
  }
}
```

Get a free Apify token at [console.apify.com/account/integrations](https://console.apify.com/account/integrations). Legacy SSE clients can use `/sse` instead of `/mcp`.

## Pricing

Pay-per-use: a small charge per tool call (no subscription, no minimum). You only pay for the data your agent actually pulls.

## Data & attribution

All data comes from the free Rotate Pilot aviation API ([docs](https://rotatepilot.com/developers) · [OpenAPI spec](https://rotatepilot.com/openapi.json)), built by a commercial pilot. Weather is live; airport/aircraft/glossary data is curated reference data.
