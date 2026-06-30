'use client';

import * as React from 'react';
import { Play, Plus, Trash2, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/code/copy-button';
import {
  HTTP_METHODS,
  DEFAULT_PATHS,
  generateCurl,
  generateTypescript,
  generatePython,
  generateJavascript,
  type HttpMethod,
  type PlaygroundState,
} from './code-generators';
import { mockDb } from '@/services/mock-data';
import { API_BASE_PATH } from '@/lib/constants';
import { cn } from '@/lib/utils';

let idCounter = 0;
const nextId = (): string => `h${++idCounter}`;

const SAMPLE_RESPONSE = JSON.stringify(
  {
    data: mockDb.measurements.slice(0, 3),
    meta: { total: 8420, page: 1, limit: 3, totalPages: 2807 },
  },
  null,
  2,
);

const methodColor: Record<HttpMethod, string> = {
  GET: 'text-success',
  POST: 'text-accent',
  PATCH: 'text-warning',
  DELETE: 'text-destructive',
};

export function ApiPlayground(): React.JSX.Element {
  const [state, setState] = React.useState<PlaygroundState>({
    method: 'GET',
    path: DEFAULT_PATHS[0],
    headers: [{ id: nextId(), key: 'Accept', value: 'application/json' }],
    params: [
      { id: nextId(), key: 'limit', value: '10' },
      { id: nextId(), key: 'page', value: '1' },
    ],
  });
  const [apiKey, setApiKey] = React.useState('dm_live_demo_key_abc123');
  const [language, setLanguage] = React.useState('curl');
  const [response, setResponse] = React.useState<string>('');
  const [status, setStatus] = React.useState<number | null>(null);
  const [latency, setLatency] = React.useState<number | null>(null);
  const [running, setRunning] = React.useState(false);

  const updateState = (patch: Partial<PlaygroundState>): void =>
    setState((prev) => ({ ...prev, ...patch }));

  const addHeader = (): void =>
    updateState({ headers: [...state.headers, { id: nextId(), key: '', value: '' }] });
  const removeHeader = (id: string): void =>
    updateState({ headers: state.headers.filter((h) => h.id !== id) });
  const updateHeader = (id: string, field: 'key' | 'value', value: string): void =>
    updateState({
      headers: state.headers.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    });

  const addParam = (): void =>
    updateState({ params: [...state.params, { id: nextId(), key: '', value: '' }] });
  const removeParam = (id: string): void =>
    updateState({ params: state.params.filter((p) => p.id !== id) });
  const updateParam = (id: string, field: 'key' | 'value', value: string): void =>
    updateState({
      params: state.params.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });

  const codeByLang: Record<string, string> = {
    curl: generateCurl(state, apiKey),
    typescript: generateTypescript(state, apiKey),
    python: generatePython(state, apiKey),
    javascript: generateJavascript(state, apiKey),
  };

  const sendRequest = async (): Promise<void> => {
    setRunning(true);
    const start = performance.now();
    await new Promise((r) => setTimeout(r, 600));
    setResponse(SAMPLE_RESPONSE);
    setStatus(200);
    setLatency(Math.round(performance.now() - start));
    setRunning(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ─── Request Builder ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-2">
            <Select
              value={state.method}
              onValueChange={(v) => updateState({ method: v as HttpMethod })}
            >
              <SelectTrigger className="w-[110px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m} className="font-mono">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={state.path}
              onChange={(e) => updateState({ path: e.target.value })}
              className="flex-1 font-mono text-sm"
              placeholder="/datasets"
            />
            <Button onClick={sendRequest} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Send
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_PATHS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updateState({ path: p })}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-xs transition-colors',
                  state.path === p
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Headers</p>
              <Button variant="ghost" size="sm" onClick={addHeader}>
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {state.headers.map((h) => (
                <div key={h.id} className="flex gap-2">
                  <Input
                    value={h.key}
                    onChange={(e) => updateHeader(h.id, 'key', e.target.value)}
                    placeholder="Header"
                    className="font-mono text-xs"
                  />
                  <Input
                    value={h.value}
                    onChange={(e) => updateHeader(h.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHeader(h.id)}
                    aria-label="Remove header"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Query Parameters</p>
              <Button variant="ghost" size="sm" onClick={addParam}>
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {state.params.map((p) => (
                <div key={p.id} className="flex gap-2">
                  <Input
                    value={p.key}
                    onChange={(e) => updateParam(p.id, 'key', e.target.value)}
                    placeholder="Key"
                    className="font-mono text-xs"
                  />
                  <Input
                    value={p.value}
                    onChange={(e) => updateParam(p.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParam(p.id)}
                    aria-label="Remove parameter"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">API Key</p>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-xs"
              placeholder="dm_live_…"
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Response & Code ─── */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Response</CardTitle>
            {status !== null ? (
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-medium',
                    status < 300 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {status} OK
                </span>
                {latency !== null ? (
                  <span className="text-muted-foreground">{latency}ms</span>
                ) : null}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="relative">
                <div className="absolute right-3 top-3">
                  <CopyButton value={response} />
                </div>
                <pre className="max-h-[320px] overflow-auto rounded-lg bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-foreground/90">
                  {response}
                </pre>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
                Send a request to see the response
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Code Example</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={language} onValueChange={setLanguage}>
              <TabsList className="mb-3">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              </TabsList>
              {Object.entries(codeByLang).map(([lang, code]) => (
                <TabsContent key={lang} value={lang}>
                  <div className="relative">
                    <div className="absolute right-3 top-3">
                      <CopyButton value={code} />
                    </div>
                    <pre className="max-h-[280px] overflow-auto rounded-lg bg-[#0d1117] p-4 font-mono text-xs leading-relaxed text-foreground/90">
                      {code}
                    </pre>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
