/**
 * Aviation MCP tools. Each is a thin wrapper over the free Rotate Pilot API
 * (https://rotatepilot.com/developers). `buildPath(args)` returns the API path;
 * the server fetches it, returns the JSON, and charges one tool-call event.
 */

const enc = (s) => encodeURIComponent(String(s ?? '').trim());

export const TOOLS = [
    {
        name: 'get_metar',
        description: 'Get the current decoded METAR (aviation weather) for an airport by ICAO code. Returns raw report, flight category (VFR/MVFR/IFR/LIFR), wind, visibility, temperature, dewpoint, and more. Optionally include the TAF forecast.',
        inputSchema: {
            type: 'object',
            properties: {
                icao: { type: 'string', description: '4-letter ICAO airport code, e.g. KJFK, EGLL, SPJC.' },
                taf: { type: 'boolean', default: false, description: 'Also include the TAF forecast.' },
            },
            required: ['icao'],
        },
        buildPath: (a) => `/api/v1/metar?icao=${enc(a.icao)}${a.taf ? '&taf=1' : ''}`,
    },
    {
        name: 'get_airport',
        description: 'Get airport information by ICAO code: name, IATA code, city, country, region, coordinates, elevation, and runway count.',
        inputSchema: {
            type: 'object',
            properties: {
                icao: { type: 'string', description: '4-letter ICAO airport code, e.g. KJFK.' },
            },
            required: ['icao'],
        },
        buildPath: (a) => `/api/v1/airport/${enc(a.icao)}`,
    },
    {
        name: 'get_aircraft',
        description: 'Get aircraft specifications by slug: engines, seats, range, cruise speed, ceiling, MTOW, type-rating requirement, and description. Example slugs: cessna-172-skyhawk, piper-pa-28-warrior, airbus-a320neo, boeing-737-800.',
        inputSchema: {
            type: 'object',
            properties: {
                slug: { type: 'string', description: 'Aircraft slug, e.g. cessna-172-skyhawk.' },
            },
            required: ['slug'],
        },
        buildPath: (a) => `/api/v1/aircraft/${enc(a.slug)}`,
    },
    {
        name: 'get_glossary_term',
        description: 'Look up the definition of an aviation term from the Rotate Pilot glossary by slug (e.g. squawk, angle-of-attack, v-speeds). Returns the definition, category, and related terms.',
        inputSchema: {
            type: 'object',
            properties: {
                term: { type: 'string', description: 'Glossary term slug, e.g. squawk.' },
            },
            required: ['term'],
        },
        buildPath: (a) => `/api/v1/glossary/${enc(a.term)}`,
    },
    {
        name: 'practice_questions',
        description: 'Get FAA-style aviation practice exam questions with options and the correct answer. Optionally filter by subject (e.g. meteorology, regulations, navigation). Great for building study tools or quizzing a user.',
        inputSchema: {
            type: 'object',
            properties: {
                subject: { type: 'string', description: 'Optional subject filter, e.g. meteorology, regulations, navigation.' },
                count: { type: 'integer', minimum: 1, maximum: 5, default: 3, description: 'Number of questions (1-5).' },
            },
        },
        buildPath: (a) => {
            const params = new URLSearchParams();
            if (a.subject) params.set('subject', String(a.subject).trim());
            params.set('count', String(Math.max(1, Math.min(5, a.count || 3))));
            return `/api/v1/question?${params.toString()}`;
        },
    },
    {
        name: 'quiz_of_the_day',
        description: 'Get the aviation question of the day — a single FAA-style multiple-choice question with the correct answer and explanation.',
        inputSchema: { type: 'object', properties: {} },
        buildPath: () => `/api/v1/quiz-of-day`,
    },
];
