import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { pushEnvironment, pushCollection } from "./postman";
import type { PostmanCollectionRequest } from "./types";
import * as dotenv from "dotenv";

dotenv.config();

describe("Postman API Functions", () => {
  const originalEnv = process.env;
  const TEST_PREFIX = "[TEST]"; // Add prefix to identify test resources

  beforeEach(() => {
    // Ensure required environment variables are set
    expect(process.env.POSTMAN_API_KEY).toBeDefined();
    expect(process.env.POSTMAN_ACTIVE_WORKSPACE_ID).toBeDefined();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("pushEnvironment", () => {
    const testEnvName = `${TEST_PREFIX} Test Environment ${Date.now()}`;

    test("should create and update environment", async () => {
      // First create a new environment
      const envVars = {
        "API_URL": "https://api.example.com",
        "API_TOKEN": "secret-token-1"
      };

      await expect(pushEnvironment(testEnvName, envVars)).resolves.not.toThrow();

      // Then update the same environment with new values
      const updatedEnvVars = {
        "API_URL": "https://api.example.com/v2",
        "API_TOKEN": "secret-token-2",
        "NEW_VAR": "new-value"
      };

      await expect(pushEnvironment(testEnvName, updatedEnvVars)).resolves.not.toThrow();
    });
  });

  describe("pushCollection", () => {
    const testCollectionName = `${TEST_PREFIX} Test Collection ${Date.now()}`;

    test("should create and update collection", async () => {
      // First create a new collection
      const collectionRequest: PostmanCollectionRequest = {
        info: {
          name: testCollectionName,
          description: "Test Description",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: [{
          name: "Test Request",
          request: {
            method: "GET",
            url: {
              raw: "https://api.example.com/test",
              protocol: "https",
              host: ["api", "example", "com"],
              path: ["test"]
            }
          }
        }]
      };

      await expect(pushCollection(collectionRequest)).resolves.not.toThrow();

      // Then update the same collection with new items
      const updatedCollectionRequest: PostmanCollectionRequest = {
        ...collectionRequest,
        item: [
          ...collectionRequest.item,
          {
            name: "Another Test Request",
            request: {
              method: "POST",
              url: {
                raw: "https://api.example.com/test2",
                protocol: "https",
                host: ["api", "example", "com"],
                path: ["test2"]
              }
            }
          }
        ]
      };

      await expect(pushCollection(updatedCollectionRequest)).resolves.not.toThrow();
    });
  });
}); 