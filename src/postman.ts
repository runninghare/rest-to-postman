
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import type { PostmanCollection, PostmanCollectionResponse, PostmanEnvironment, PostmanWorkspaceResponse, PostmanCollectionsResponse, PostmanRequest, EnvValue, PostmanCollectionRequest } from './types';

dotenv.config();

export async function pushEnvironment(environmentName: string, envVars: Record<string, string>): Promise<void> {
  try {
    console.log(`Creating/Updating environment: ${environmentName}`);
    
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
    console.log('Checking if environment already exists...');


    // Check if environment already exists
    console.log('Checking if environment already exists...');
    const workspaceResponse = await axios({
      method: 'get',
      url: `https://api.getpostman.com/workspaces/${process.env.POSTMAN_ACTIVE_WORKSPACE_ID}`,
      headers: {
        'X-Api-Key': process.env.POSTMAN_API_KEY
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
      console.log(`Updating existing environment: ${environmentName}`);
      response = await axios({
        method: 'put',
        url: `https://api.getpostman.com/environments/${existingEnvironment.id}`,
        headers: {
          'X-Api-Key': process.env.POSTMAN_API_KEY,
          'Content-Type': 'application/json'
        },
        data: environmentData
      });
    } else {
      console.log(`Creating new environment: ${environmentName}`);
      response = await axios({
        method: 'post',
        url: 'https://api.getpostman.com/environments',
        headers: {
          'X-Api-Key': process.env.POSTMAN_API_KEY,
          'Content-Type': 'application/json'
        },
        data: {
          ...environmentData,
          workspace: process.env.POSTMAN_ACTIVE_WORKSPACE_ID
        }
      });
    }
    
    console.log(`Environment ${environmentName} successfully ${existingEnvironment ? 'updated' : 'created'}`);
  } catch (error) {
    console.error('Error in pushEnvironment:', error);
    throw error;
  }
}

export async function pushCollection(collectionRequest: PostmanCollectionRequest): Promise<void> {
    try {
        console.log('Pushing collection to Postman...');

        // Create collection container
        const containerRequestBody = {
            collection: collectionRequest,
            workspace: process.env.POSTMAN_ACTIVE_WORKSPACE_ID
        };

        // Check if collection already exists
        console.log('Checking if collection already exists...');
        console.log(`workspace is: ${process.env.POSTMAN_ACTIVE_WORKSPACE_ID}`);
        const workspaceResponse = await axios({
            method: 'get',
            url: `https://api.getpostman.com/workspaces/${process.env.POSTMAN_ACTIVE_WORKSPACE_ID}`,
            headers: {
                'X-Api-Key': process.env.POSTMAN_API_KEY
            }
        });

        const workspaceData = workspaceResponse.data as PostmanWorkspaceResponse;
        const existingCollection = workspaceData.workspace.collections?.find(
            collection => collection.name === collectionRequest.info.name
        );

        let response;
        if (existingCollection) {
            console.log(`Updating existing collection: ${collectionRequest.info.name}`);
            response = await axios({
                method: 'put',
                url: `https://api.getpostman.com/collections/${existingCollection.id}`,
                headers: {
                    'X-Api-Key': process.env.POSTMAN_API_KEY,
                    'Content-Type': 'application/json'
                },
                data: containerRequestBody
            });
        } else {
            console.log(`Creating new collection: ${collectionRequest.info.name}`);
            response = await axios({
                method: 'post',
                url: 'https://api.getpostman.com/collections',
                headers: {
                    'X-Api-Key': process.env.POSTMAN_API_KEY,
                    'Content-Type': 'application/json'
                },
                data: containerRequestBody
            });
        }

        console.log(`Collection ${collectionRequest.info.name} successfully ${existingCollection ? 'updated' : 'created'}`);
    } catch (error) {
        console.error('Error in pushCollection:', error);
        throw error;
    }
}