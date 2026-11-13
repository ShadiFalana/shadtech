// `embedded-postgres` is ESM-only and its `exports` map is not understood by
// the backend's classic `node` module resolution. We only use a small surface
// of its API from the dev database script, so declare it locally.
declare module 'embedded-postgres' {
  interface EmbeddedPostgresOptions {
    databaseDir: string;
    user?: string;
    password?: string;
    port?: number;
    persistent?: boolean;
    initdbFlags?: string[];
    onLog?: (message: string) => void;
    onError?: (messageOrError: string | Error | unknown) => void;
  }

  export default class EmbeddedPostgres {
    constructor(options?: Partial<EmbeddedPostgresOptions>);
    initialise(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    createDatabase(name: string): Promise<void>;
  }
}
