# REST-to-Postman MCP

[![smithery badge](https://smithery.ai/badge/@runninghare/rest-to-postman-mcp)](https://smithery.ai/server/@runninghare/rest-to-postman-mcp)

A Model Context Protocol (MCP) server that converts REST API code (e.g., NestJS controllers, FastAPI/Flask endpoints) to Postman collections and environments. This tool helps developers automatically sync their REST API endpoints and environment configurations with Postman.

## Features

- Convert REST API endpoints to Postman collections
- Sync environment variables with Postman environments
- Support for various authentication methods (e.g., Bearer token)
- Intelligent merging of new endpoints with existing collections
- Automatic handling of sensitive environment variables
- Support for both stdio and SSE transport modes

## Prerequisites

- [Bun](https://bun.sh) v1.2.2 or later
- Postman API Key
- Postman Workspace ID

## Installation & Usage

This is a Model Context Protocol (MCP) stdio server that requires access to your Postman workspace to create/update collections and environments.

### Installing via Smithery

To install REST-to-Postman MCP for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@runninghare/rest-to-postman-mcp):

```bash
npx -y @smithery/cli install @runninghare/rest-to-postman-mcp --client claude
```

### Running the MCP Server

To use the MCP server in production:

1. Install the package globally:
```bash
npm install -g rest-to-postman-mcp
```

2. Run the server with your Postman credentials:
```bash
rest-to-postman-mcp --postman-api-key your_api_key --postman-workspace-id your_workspace_id
```

Or use environment variables:
```bash
export POSTMAN_API_KEY=your_api_key
export POSTMAN_ACTIVE_WORKSPACE_ID=your_workspace_id
rest-to-postman-mcp
```

You can integrate this command with various AI code editors that support MCP:
- Claude Desktop
- Cursor
- Windsurf
- Roo Cline Editor

> **Important Note**: The server requires Postman API credentials to function. Make sure you have both the API key and workspace ID ready before starting the server.

### Tool Descriptions

The server provides two main tools:

#### 1. REST to Postman Environment (`rest_to_postman_env`)

Creates or updates a Postman environment with your application's environment variables.

**Input Parameters:**
- `envName` (string): Name of the Postman environment
- `envVars` (object): Key-value pairs of environment variables

**Example Input:**
```json
{
    "envName": "REST Environment",
    "envVars": {
        "API_URL": "https://api.example.com",
        "API_TOKEN": "secret-token-1"
    }
}
```

#### 2. REST to Postman Collection (`rest_to_postman_collection`)

Creates or updates a Postman collection with your REST API endpoints.

**Input Parameters:**
- `collectionRequest` (object): Postman collection configuration containing:
  - `info`: Collection metadata
  - `auth`: Authentication settings
  - `item`: Array of API endpoints

**Example Input:**
```json
{
    "info": {
        "name": "REST Collection",
        "description": "REST Collection", 
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "auth": {
        "type": "bearer",
        "bearer": [
            {   
                "key": "Authorization",
                "value": "Bearer {{API_TOKEN}}",
                "type": "string"
            }
        ]
    },  
    "item": [
        {
            "name": "Get Users",
            "request": {
                "method": "GET",    
                "url": {
                    "raw": "{{API_URL}}/users",
                    "protocol": "https",
                    "host": ["api", "example", "com"],
                    "path": ["users"]
                }   
            }
        }
    ]
}
```

### Response Format

Both tools return a success message confirming the creation/update of the Postman resource:

```json
{
    "content": [{
        "type": "text",
        "text": "Successfully created/updated Postman environment: REST Environment"
    }]
}
```

## Development

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rest-to-postman-mcp.git
cd rest-to-postman-mcp
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file:
```env
POSTMAN_API_KEY=your_api_key_here
POSTMAN_ACTIVE_WORKSPACE_ID=your_workspace_id_here
```

### Running in Development Mode

For development, you can run the server directly using Bun:

```bash
# Start in stdio mode (default)
bun run src/mcp.ts

# Start in SSE mode
bun run src/mcp.ts --sse
```

### Building

To build the project:

```bash
bun run build
```

This will create a bundled output in the `dist` directory.

### Scripts

- `bun run build` - Build the project
- `bun run dev` - Run the server in development mode
- `bun run startSSE` - Start the server in SSE mode

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
