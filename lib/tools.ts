// Tool definitions for the chatbot

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Web search tool (placeholder - would need actual API integration)
export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for current information. Use this when you need up-to-date information that might not be in the knowledge base.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to look up on the web',
      },
    },
    required: ['query'],
  },
};

// Get current date tool
export const getCurrentDateTool: Tool = {
  name: 'get_current_date',
  description: 'Get the current date and time. Use this when users ask about dates, time, or scheduling.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
};

// Calculate tool
export const calculateTool: Tool = {
  name: 'calculate',
  description: 'Perform mathematical calculations. Use this when users ask for computations or math problems.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")',
      },
    },
    required: ['expression'],
  },
};

export const availableTools: Tool[] = [
  webSearchTool,
  getCurrentDateTool,
  calculateTool,
];

// Tool execution functions
export async function executeTool(toolName: string, args: any): Promise<string> {
  switch (toolName) {
    case 'get_current_date':
      return JSON.stringify({
        date: new Date().toISOString(),
        formatted: new Date().toLocaleString(),
      });

    case 'calculate':
      try {
        // Simple safe evaluation - in production, use a proper math parser
        const result = Function(`"use strict"; return (${args.expression})`)();
        return JSON.stringify({ result, expression: args.expression });
      } catch (error) {
        return JSON.stringify({ error: 'Invalid mathematical expression', expression: args.expression });
      }

    case 'web_search':
      // Placeholder - in production, integrate with a search API like SerpAPI, Tavily, etc.
      return JSON.stringify({
        results: [
          {
            title: 'Web Search Placeholder',
            snippet: `Search results for "${args.query}". In production, this would return actual search results from a web search API.`,
            url: 'https://example.com',
          },
        ],
        query: args.query,
      });

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
