export interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  body?: any;
  socket: { remoteAddress?: string };
}

export interface VercelResponse {
  setHeader(name: string, value: string | number | readonly string[]): void;
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  send(body: unknown): VercelResponse;
}
