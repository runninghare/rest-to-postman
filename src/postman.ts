import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import type { PostmanCollection, PostmanCollectionResponse, PostmanEnvironment, PostmanWorkspaceResponse, PostmanCollectionsResponse, PostmanRequest, EnvValue, PostmanCollectionRequest } from './types';

dotenv.config();

export async function getEnvironment(environmentName: string, postmanApiKey?: string, workspaceId?: string) {
  const apiKey = postmanApiKey || process.env.POSTMAN_API_KEY;
  const activeWorkspaceId = workspaceId || process.env.POSTMAN_ACTIVE_WORKSPACE_ID;

  const workspaceResponse = await axios({
    method: 'get',
    url: `https://api.getpostman.com/workspaces/${activeWorkspaceId}`,
    headers: {
      'X-Api-Key': apiKey
    }
  });

  const workspaceData = workspaceResponse.data as PostmanWorkspaceResponse;
  const environment = workspaceData.workspace.environments?.find(
    env => env.name === environmentName
  );

  if (!environment) {
    throw new Error(`Environment ${environmentName} not found`);
  }

  const response = await axios({
    method: 'get',
    url: `https://api.getpostman.com/environments/${environment.id}`,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  return response.data.environment as PostmanEnvironment;
}

export async function pushEnvironment(environmentName: string, envVars: Record<string, string>, postmanApiKey?: string, workspaceId?: string): Promise<void> {
  try {
    const apiKey = postmanApiKey || process.env.POSTMAN_API_KEY;
    const activeWorkspaceId = workspaceId || process.env.POSTMAN_ACTIVE_WORKSPACE_ID;

    // Read all environment variables except POSTMAN_API_KEY and POSTMAN_ACTIVE_WORKSPACE_ID
    const envValues: EnvValue[] = [];
    
    for (const [key, value] of Object.entries(envVars)) {
        envValues.push({
            key,
            value,
            enabled: true,
            type: key.includes('token') ? 'secret' : 'default'
        });
    }

    // Check if environment already exists
    const workspaceResponse = await axios({
      method: 'get',
      url: `https://api.getpostman.com/workspaces/${activeWorkspaceId}`,
      headers: {
        'X-Api-Key': apiKey
      }
    });
    
    const workspaceData = workspaceResponse.data as PostmanWorkspaceResponse;
    const existingEnvironment = workspaceData.workspace.environments?.find(
      env => env.name === environmentName
    );
    
    // Prepare the environment data
    const environmentData = {
      environment: {
        name: environmentName,
        values: envValues
      }
    };

    let response;
    if (existingEnvironment) {
      response = await axios({
        method: 'put',
        url: `https://api.getpostman.com/environments/${existingEnvironment.id}`,
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        data: environmentData
      });
    } else {
      response = await axios({
        method: 'post',
        url: 'https://api.getpostman.com/environments',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        data: {
          ...environmentData,
          workspace: activeWorkspaceId
        }
      });
    }
    
  } catch (error) {
    throw error;
  }
}

export async function getCollection(collectionName: string, postmanApiKey?: string, workspaceId?: string) {
  const apiKey = postmanApiKey || process.env.POSTMAN_API_KEY;
  const activeWorkspaceId = workspaceId || process.env.POSTMAN_ACTIVE_WORKSPACE_ID;

  const workspaceResponse = await axios({
    method: 'get',
    url: `https://api.getpostman.com/workspaces/${activeWorkspaceId}`,
    headers: {
      'X-Api-Key': apiKey
    }
  });

  const workspaceData = workspaceResponse.data as PostmanWorkspaceResponse;
  const collection = workspaceData.workspace.collections?.find(
    collection => collection.name === collectionName
  );

  if (!collection) {
    throw new Error(`Collection ${collectionName} not found`);
  }

  const collectionResponse = await axios({  
    method: 'get',
    url: `https://api.getpostman.com/collections/${collection.id}`,
    headers: {
      'X-Api-Key': apiKey
    }
  });

  return collectionResponse.data.collection as PostmanCollection;
}

export async function pushCollection(collectionRequest: PostmanCollectionRequest, postmanApiKey?: string, workspaceId?: string): Promise<void> {
    try {
        const apiKey = postmanApiKey || process.env.POSTMAN_API_KEY;
        const activeWorkspaceId = workspaceId || process.env.POSTMAN_ACTIVE_WORKSPACE_ID;

        // Create collection container
        const containerRequestBody = {
            collection: collectionRequest,
            workspace: activeWorkspaceId
        };

        // Check if collection already exists
        try {
            const workspaceResponse = await axios({
                method: 'get',
                url: `https://api.getpostman.com/workspaces/${activeWorkspaceId}`,
                headers: {
                    'X-Api-Key': apiKey
                }
            });
    
            const workspaceData = workspaceResponse.data as PostmanWorkspaceResponse;
            var existingCollection = workspaceData.workspace.collections?.find(
                collection => collection.name === collectionRequest.info.name
            );   
        } catch (error) {
            console.error('Error in pushCollection:', error);
        }

        let response;
        if (existingCollection) {
            // Reuse getCollection to fetch existing collection data
            const existingCollectionData = await getCollection(collectionRequest.info.name, apiKey, activeWorkspaceId);
            
            // Helper function to normalize request for comparison
            const normalizeRequest = (request: PostmanRequest) => {
                const normalized = JSON.parse(JSON.stringify(request));
                // Remove id and uid
                delete normalized.id;
                delete normalized.uid;
                // Remove empty arrays
                if (normalized.response && normalized.response.length === 0) delete normalized.response;
                if (normalized.request?.header && normalized.request.header.length === 0) delete normalized.request.header;
                return JSON.stringify(normalized);
            };

            // Deduplicate items while merging
            const existingItems = existingCollectionData.item || [];
            const newItems = collectionRequest.item || [];
            const uniqueItems = [...existingItems];
            
            for (const newItem of newItems) {
                const normalizedNew = normalizeRequest(newItem);
                const isDuplicate = uniqueItems.some(existingItem => 
                    normalizeRequest(existingItem) === normalizedNew
                );
                if (!isDuplicate) {
                    uniqueItems.push(newItem);
                }
            }

            // Merge the collections
            const mergedCollection: PostmanCollectionRequest = {
                info: {
                    ...existingCollectionData.info,
                    ...collectionRequest.info
                },
                auth: collectionRequest.auth || existingCollectionData.auth,
                item: uniqueItems,
                event: [...(existingCollectionData.event || []), ...(collectionRequest.event || [])]
            };

            // remove `auth` if it is empty
            if (mergedCollection.auth && Object.keys(mergedCollection.auth).length === 0) {
                delete mergedCollection.auth;
            }

            // console.log(JSON.stringify(mergedCollection, null, 2));

            // Update with merged data
            response = await axios({
                method: 'put',
                url: `https://api.getpostman.com/collections/${existingCollection.id}`,
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                data: {
                    collection: mergedCollection,
                    workspace: activeWorkspaceId
                }
            });
        } else {
            // Remove `auth` if it is empty
            if (containerRequestBody.collection.auth && Object.keys(containerRequestBody.collection.auth).length === 0) {
                delete containerRequestBody.collection.auth;
            }

            response = await axios({
                method: 'post',
                url: 'https://api.getpostman.com/collections',
                headers: {
                    'X-Api-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                data: containerRequestBody
            });
        }

    } catch (error) {
        console.error('Error in pushCollection:', error);
        throw error;
    }
}