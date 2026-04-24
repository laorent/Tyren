// ============================================================
// Tyren — Centralized Type Definitions
// ============================================================

// ----- Chat Message Types -----

/** Grounding source from Google Search */
export interface GroundingChunk {
    web?: {
        title?: string;
        uri?: string;
    };
}

/** Grounding metadata returned by the Gemini API when Google Search is enabled */
export interface GroundingMetadata {
    groundingChunks?: GroundingChunk[];
    webSearchQueries?: string[];
    searchEntryPoint?: {
        renderedContent?: string;
        renderedHtml?: string;
    };
}

/** A single chat message (client-side representation) */
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    thought?: string;
    images?: string[];
    timestamp: number;
    grounding?: GroundingMetadata;
}

// ----- API Request / Response Types -----

/** Message as sent from the client to the /api/chat endpoint */
export interface ChatRequestMessage {
    role: string;
    content: string;
    images?: string[];
}

/** Body of the /api/chat POST request */
export interface ChatRequestBody {
    messages: ChatRequestMessage[];
    searchEnabled: boolean;
    thinkingEnabled: boolean;
}

// ----- Gemini SDK Types (used in route.ts) -----

export interface InlineDataPart {
    inlineData: {
        mimeType: string;
        data: string;
    };
}

export interface TextPart {
    text: string;
}

export type Part = TextPart | InlineDataPart;

export interface HistoryItem {
    role: 'user' | 'model';
    parts: Part[];
}

// ----- SSE Stream Event Types -----

export interface SSEContentEvent {
    content: string;
}

export interface SSEThoughtEvent {
    thought: string;
}

export interface SSEGroundingEvent {
    grounding: GroundingMetadata;
}

export interface SSEErrorEvent {
    error: string;
}

export type SSEEvent = SSEContentEvent | SSEThoughtEvent | SSEGroundingEvent | SSEErrorEvent;

// ----- React Markdown Component Types -----

export interface CodeComponentProps {
    node?: unknown;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}
