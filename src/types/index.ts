export interface ScriptEvent {
    listen: string;
    script: {
      type: string;
      exec: string[];
    };
  }
  
  export interface QueryParam {
    key: string;
    value: string;
  }
  
  export interface Auth {
    type: string;
    bearer?: {
      key: string;
      value: string;
      type: string;
    }[];
  }
  
  export interface UrlObject {
    raw: string;
    protocol: string;
    host: string[];
    path: string[];
    query?: QueryParam[];
  }
  
  export interface RequestObject {
    method: string;
    url: UrlObject;
    auth?: Auth;
    description?: string;
  }
  
  export interface PostmanRequest {
    name: string;
    request: RequestObject;
    event?: ScriptEvent[];
  }
  
  export interface PostmanCollection {
    info: {
      name: string;
      description: string;
      schema: string;
    };
    item: PostmanRequest[];
    event?: ScriptEvent[];
    auth?: Auth;
  }
  
  export interface EnvValue {
    key: string;
    value: string;
    enabled: boolean;
    type: string;
  }
  
  export interface PostmanEnvironment {
    id: string;
    uuid: string;
    name: string;
    isPublic: boolean;
    values: EnvValue[];
  }
  
  export interface PostmanCollectionResponse {
    collection: PostmanCollection;
  }
  
  export interface PostmanWorkspaceResponse {
    workspace: {
      collections: {
        id: string;
        name: string;
        uid: string;
      }[];
      environments: {
        id: string;
        name: string;
        uid: string;
      }[];
    };
  }
  
  export interface PostmanCollectionsResponse {
    collections: {
      id: string;
      name: string;
      owner: string;
      createdAt: string;
      updatedAt: string;
      uid: string;
      isPublic: boolean;
    }[];
  } 

export interface PostmanCollectionRequest {
    info: {
        name: string,
        description: string,
        schema: string
    },
    auth?: {
        type: string,
        bearer: [
            {
                key: string,
                value: string,
                type: string
            }
        ]
    },
    item: PostmanRequest[],
    event?: ScriptEvent[]
}

