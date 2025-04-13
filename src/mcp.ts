#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { type Request, type Response } from 'express';
import { pushEnvironment, pushCollection } from './postman.js';
import type { PostmanCollectionRequest } from '../src/types';

// Configure environment variables
dotenv.config();

const envExample = `
{
    "envName": "REST Environment",
    "envVars": {
        "API_URL": "https://api.example.com",
        "API_TOKEN": "secret-token-1"
    }
}
`

const collectionExample = `
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
        },
        {
            "name": "Create User",
            "request": {
                "method": "POST",
                "url": {
                    "raw": "{{API_URL}}/users"
                },
                "body": {
                    "mode": "raw",
                    "raw": "{\"name\":\"John Doe\",\"email\":\"john.doe@example.com\"}"
                }
            }   
        }
    ]
}
`





const tools = [
  {
    "name": "rest_to_postman_env",
    "description": "Creates or updates a Postman environment with the provided environment variables. This tool helps synchronize your REST application's environment configuration with Postman. It supports both creating new environments and updating existing ones in your Postman workspace. Environment variables related to sensitive data (containing 'token' in their names) are automatically marked as secrets. Here's an example: \n\n" + envExample,
    "inputSchema": {
      "type": "object",
      "properties": {
        "envName": {
          "type": "string",
          "description": "The name of the Postman environment to create or update"
        },
        "envVars": {
          "type": "object",
          "description": "A record of environment variables to be added to the Postman environment. Format: { [key: string]: string }",
          "additionalProperties": {
            "type": "string"
          }
        }
      },
      "required": ["envName", "envVars"]
    }
  },
  {
    "name": "rest_to_postman_collection",
    "description": "Creates or updates a Postman collection with the provided collection configuration. This tool helps synchronize your REST API endpoints with Postman. When updating an existing collection, it intelligently merges the new endpoints with existing ones, avoiding duplicates while preserving custom modifications made in Postman. Here's an example: \n\n" + collectionExample,
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionRequest": {
          "type": "object",
          "description": "The Postman collection configuration containing info, items, and other collection details",
          "properties": {
            "info": {
              "type": "object",
              "description": "Collection information including name and schema",
              "properties": {
                "name": {
                  "type": "string",
                  "description": "Name of the collection"
                },
                "description": {
                  "type": "string",
                  "description": "Description of the collection"
                },
                "schema": {
                  "type": "string",
                  "description": "Schema version of the collection"
                }
              },
              "required": ["name", "description", "schema"]
            },
            "auth": {
              "type": "object",
              "description": "Authentication settings for the collection",
              "properties": {
                "type": {
                  "type": "string",
                  "description": "Type of authentication (e.g., 'bearer')"
                },
                "bearer": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "key": {
                        "type": "string",
                        "description": "Key for the bearer token"
                      },
                      "value": {
                        "type": "string",
                        "description": "Value of the bearer token"
                      },
                      "type": {
                        "type": "string",
                        "description": "Type of the bearer token"
                      }
                    },
                    "required": ["key", "value", "type"]
                  }
                }
              },
              "required": ["type"]
            },
            "item": {
              "type": "array",
              "description": "Array of request items in the collection",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "Name of the request"
                  },
                  "request": {
                    "type": "object",
                    "properties": {
                      "method": {
                        "type": "string",
                        "description": "HTTP method of the request"
                      },
                      "url": {
                        "type": "object",
                        "properties": {
                          "raw": {
                            "type": "string",
                            "description": "Raw URL string"
                          },
                          "protocol": {
                            "type": "string",
                            "description": "URL protocol (e.g., 'http', 'https')"
                          },
                          "host": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "Host segments"
                          },
                          "path": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            },
                            "description": "URL path segments"
                          },
                          "query": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "key": {
                                  "type": "string",
                                  "description": "Query parameter key"
                                },
                                "value": {
                                  "type": "string",
                                  "description": "Query parameter value"
                                }
                              },
                              "required": ["key", "value"]
                            }
                          }
                        },
                        "required": ["raw", "protocol", "host", "path"]
                      },
                      "auth": {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "description": "Type of authentication"
                          },
                          "bearer": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "key": {
                                  "type": "string"
                                },
                                "value": {
                                  "type": "string"
                                },
                                "type": {
                                  "type": "string"
                                }
                              },
                              "required": ["key", "value", "type"]
                            }
                          }
                        },
                        "required": ["type"]
                      },
                      "description": {
                        "type": "string",
                        "description": "Description of the request"
                      }
                    },
                    "required": ["method", "url"]
                  },
                  "event": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "listen": {
                          "type": "string",
                          "description": "Event type to listen for"
                        },
                        "script": {
                          "type": "object",
                          "properties": {
                            "type": {
                              "type": "string",
                              "description": "Type of script"
                            },
                            "exec": {
                              "type": "array",
                              "items": {
                                "type": "string"
                              },
                              "description": "Array of script lines to execute"
                            }
                          },
                          "required": ["type", "exec"]
                        }
                      },
                      "required": ["listen", "script"]
                    }
                  }
                },
                "required": ["name", "request"]
              }
            },
            "event": {
              "type": "array",
              "description": "Collection-level event scripts",
              "items": {
                "type": "object",
                "properties": {
                  "listen": {
                    "type": "string",
                    "description": "Event type to listen for"
                  },
                  "script": {
                    "type": "object",
                    "properties": {
                      "type": {
                        "type": "string",
                        "description": "Type of script"
                      },
                      "exec": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        },
                        "description": "Array of script lines to execute"
                      }
                    },
                    "required": ["type", "exec"]
                  }
                },
                "required": ["listen", "script"]
              }
            }
          },
          "required": ["info", "item"]
        }
      },
      "required": ["collectionRequest"]
    }
  }
];

class PostmanMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "rest-to-postman-mcp",
        version: "0.1.0"
      },
      {
        capabilities: {
          tools: {},
        }
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      console.log("SIGINT received");
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools
    }));

    // Call tool handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const tool = tools.find((t) => t.name === request.params.name);
        if (!tool) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        try {
          if (request.params.name === "rest_to_postman_env") {
            if (!request.params.arguments) {
              throw new McpError(ErrorCode.InvalidParams, "Missing arguments");
            }
            const { envName, envVars } = request.params.arguments as { envName: string; envVars: Record<string, string> };
            await pushEnvironment(envName, envVars, process.env.POSTMAN_API_KEY, process.env.POSTMAN_ACTIVE_WORKSPACE_ID);
            return {
              content: [{
                type: "text",
                text: `Successfully created/updated Postman environment: ${envName}`
              }]
            };
          } else if (request.params.name === "rest_to_postman_collection") {
            if (!request.params.arguments) {
              throw new McpError(ErrorCode.InvalidParams, "Missing arguments");
            }
            const { collectionRequest } = request.params.arguments as { collectionRequest: PostmanCollectionRequest };
            await pushCollection(collectionRequest, process.env.POSTMAN_API_KEY, process.env.POSTMAN_ACTIVE_WORKSPACE_ID);
            return {
              content: [{
                type: "text",
                text: `Successfully created/updated Postman collection: ${collectionRequest.info.name}`
              }]
            };
          }

          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        } catch (error) {
          console.error("Error executing tool:", error);
          return {
            content: [{
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true,
          };
        }
      }
    );
  }

  async runStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr to avoid interfering with MCP communication on stdout
    console.error("Postman MCP server running on stdio");
  }

  async runSSE() {
    const app = express();
    const transports = new Map<string, SSEServerTransport>();

    app.get("/sse", async (req: Request, res: Response) => {
      const transport = new SSEServerTransport("/messages", res);
      await this.server.connect(transport);
      // Store the transport instance for later use. For simplicity, we assume a single client here.
      app.locals.transport = transport;
    });
    
    app.post("/messages", async (req: Request, res: Response) => {
      const transport = app.locals.transport;
      await transport.handlePostMessage(req, res);
    });

    app.listen(3012, () => {
      console.log(`Server is running on port 3012`);
    });
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const useSSE = args.includes('--sse');
const useStdio = args.includes('--stdio') || !useSSE; // Default to stdio if neither is specified

// Parse Postman credentials from CLI
const postmanApiKeyIndex = args.indexOf('--postman-api-key');
const postmanWorkspaceIdIndex = args.indexOf('--postman-workspace-id');

if (postmanApiKeyIndex !== -1 && args[postmanApiKeyIndex + 1]) {
  process.env.POSTMAN_API_KEY = args[postmanApiKeyIndex + 1];
}

if (postmanWorkspaceIdIndex !== -1 && args[postmanWorkspaceIdIndex + 1]) {
  process.env.POSTMAN_ACTIVE_WORKSPACE_ID = args[postmanWorkspaceIdIndex + 1];
}

// Start the server
const server = new PostmanMcpServer();
if (useSSE) {
  console.error("Starting server in SSE mode");
  server.runSSE().catch(console.error);
} else {
  console.error("Starting server in stdio mode");
  server.runStdio().catch(console.error);
}

// Export for testing
export { PostmanMcpServer };
