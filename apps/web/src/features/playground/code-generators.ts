import { z } from 'zod';

export const HTTP_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface PlaygroundState {
  method: HttpMethod;
  path: string;
  headers: Array<{ id: string; key: string; value: string }>;
  params: Array<{ id: string; key: string; value: string }>;
}

export const DEFAULT_PATHS = [
  '/datasets',
  '/datasets/air-quality-pm25-de/measurements',
  '/measurements',
  '/api-keys',
] as const;

export function buildUrl(base: string, path: string, params: PlaygroundState['params']): string {
  const url = new URL(path, base);
  for (const p of params) {
    if (p.key && p.value) url.searchParams.set(p.key, p.value);
  }
  return url.toString();
}

export function generateCurl(state: PlaygroundState, apiKey: string): string {
  const url = buildUrl('https://api.data-mesh.dev', state.path, state.params);
  const headerArgs = state.headers
    .filter((h) => h.key && h.value)
    .map((h) => `  -H "${h.key}: ${h.value}"`);
  const authArg = apiKey ? `  -H "Authorization: Bearer ${apiKey}"` : '';
  const allHeaders = [authArg, ...headerArgs].filter(Boolean).join(' \\\n');
  const methodArg = state.method !== 'GET' ? `  -X ${state.method} \\\n` : '';
  return `curl ${methodArg}"${url}"${allHeaders ? ` \\\n${allHeaders}` : ''}`;
}

export function generateTypescript(state: PlaygroundState, apiKey: string): string {
  const paramsObj = state.params
    .filter((p) => p.key)
    .map((p) => `    ${p.key}: ${p.value ? `"${p.value}"` : 'undefined'},`)
    .join('\n');
  return `import { DataMesh } from '@data-mesh/sdk';

const client = new DataMesh({
  apiKey: ${apiKey ? `'${apiKey}'` : 'process.env.DATA_MESH_KEY'},
});

const response = await client.request({
  method: '${state.method}',
  path: '${state.path}',
${paramsObj ? `  params: {\n${paramsObj}\n  },` : ''}
});

console.log(response.data);`;
}

export function generatePython(state: PlaygroundState, apiKey: string): string {
  const paramsObj = state.params
    .filter((p) => p.key && p.value)
    .map((p) => `    "${p.key}": "${p.value}",`)
    .join('\n');
  return `import os
from data_mesh import DataMesh

client = DataMesh(
    api_key=${apiKey ? `f"${apiKey}"` : 'os.environ["DATA_MESH_KEY"]'},
)

response = client.request(
    method="${state.method}",
    path="${state.path}",
${paramsObj ? `    params={\n${paramsObj}\n    },` : ''}
)

for item in response.data:
    print(item)`;
}

export function generateJavascript(state: PlaygroundState, apiKey: string): string {
  const paramsObj = state.params
    .filter((p) => p.key)
    .map((p) => `    ${p.key}: ${p.value ? `"${p.value}"` : 'undefined'},`)
    .join('\n');
  return `import { DataMesh } from '@data-mesh/sdk';

const client = new DataMesh({
  apiKey: ${apiKey ? `'${apiKey}'` : 'process.env.DATA_MESH_KEY'},
});

const response = await client.request({
  method: '${state.method}',
  path: '${state.path}',
${paramsObj ? `  params: {\n${paramsObj}\n  },` : ''}
});

console.log(response.data);`;
}
