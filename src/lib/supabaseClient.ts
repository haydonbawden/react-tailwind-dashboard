import {
  artifacts,
  auditTrail,
  auditTypeVersions,
  auditTypes,
  audits,
  docxTemplates,
  emailTemplates,
  evidenceSubmissions,
  findings,
  organisations,
  payments,
  profiles,
  runtimeSettings,
  uploads,
  verificationResults,
} from "../data/mockData";
import {
  Artifact,
  AuditSummary,
  AuditTrailEntry,
  AuditType,
  AuditTypeVersion,
  EmailTemplate,
  EvidenceSubmission,
  Finding,
  Organisation,
  Payment,
  Profile,
  RuntimeSetting,
  DocxTemplate,
  UploadSummary,
} from "../types/models";

export type SupabaseAuthChangeEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED";

export interface SupabaseError {
  message: string;
  code?: string;
  status?: number;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "bearer";
  user: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
}

type AuthListener = (event: SupabaseAuthChangeEvent, session: SupabaseSession | null) => void;

type AuthResponse = {
  data: { session: SupabaseSession | null };
  error: SupabaseError | null;
};

type AuthSubscription = {
  data: { subscription: { unsubscribe: () => void } };
  error: SupabaseError | null;
};

export interface SupabaseAuth {
  getSession(): Promise<AuthResponse>;
  signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse>;
  signUp(input: {
    email: string;
    password: string;
    data?: Record<string, unknown>;
  }): Promise<AuthResponse>;
  signOut(): Promise<{ error: SupabaseError | null }>;
  onAuthStateChange(listener: AuthListener): AuthSubscription;
  getAccessToken(): string | null;
}

interface QueryResult<T> {
  data: T[] | null;
  error: SupabaseError | null;
}

interface SingleQueryResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

interface QueryBuilder<T extends Record<string, unknown>> {
  select(columns?: string): Promise<QueryResult<T>>;
  maybeSingle(columns?: string): Promise<SingleQueryResult<T>>;
  single(columns?: string): Promise<SingleQueryResult<T>>;
  eq(column: keyof T | string, value: unknown): QueryBuilder<T>;
  in(column: keyof T | string, values: unknown[]): QueryBuilder<T>;
  order(column: keyof T | string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
}

interface RpcResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

interface FunctionInvokeResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseClient {
  auth: SupabaseAuth;
  from<T extends Record<string, unknown>>(table: string): QueryBuilder<T>;
  rpc<T>(fn: string, args?: Record<string, unknown>): Promise<RpcResult<T>>;
  functions: {
    invoke<T>(
      name: string,
      options?: { method?: string; body?: unknown; headers?: Record<string, string> }
    ): Promise<FunctionInvokeResult<T>>;
  };
}

class AuthBase implements SupabaseAuth {
  protected session: SupabaseSession | null;
  private listeners = new Set<AuthListener>();
  private readonly storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
    this.session = this.restore();
  }

  private restore(): SupabaseSession | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(this.storageKey);
      return stored ? (JSON.parse(stored) as SupabaseSession) : null;
    } catch (error) {
      console.error("Failed to restore session", error);
      return null;
    }
  }

  protected persist(session: SupabaseSession | null) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (session) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.error("Failed to persist session", error);
    }
  }

  protected setSession(session: SupabaseSession | null, event: SupabaseAuthChangeEvent) {
    this.session = session;
    this.persist(session);
    this.notify(event, session);
  }

  protected notify(event: SupabaseAuthChangeEvent, session: SupabaseSession | null) {
    this.listeners.forEach((listener) => listener(event, session));
  }

  onAuthStateChange(listener: AuthListener): AuthSubscription {
    this.listeners.add(listener);
    return {
      data: {
        subscription: {
          unsubscribe: () => this.listeners.delete(listener),
        },
      },
      error: null,
    };
  }

  async getSession(): Promise<AuthResponse> {
    return { data: { session: this.session }, error: null };
  }

  getAccessToken(): string | null {
    return this.session?.access_token ?? null;
  }

  // The following methods must be implemented by subclasses
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signInWithPassword(_credentials: { email: string; password: string }): Promise<AuthResponse> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signUp(_input: {
    email: string;
    password: string;
    data?: Record<string, unknown>;
  }): Promise<AuthResponse> {
    throw new Error("Not implemented");
  }

  async signOut(): Promise<{ error: SupabaseError | null }> {
    this.setSession(null, "SIGNED_OUT");
    return { error: null };
  }
}

const parseError = (error: unknown, fallbackMessage: string): SupabaseError => {
  if (!error) {
    return { message: fallbackMessage };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "object") {
    const maybe = error as { message?: string; code?: string; status?: number };
    return {
      message: maybe.message ?? fallbackMessage,
      code: maybe.code,
      status: maybe.status,
    };
  }

  return { message: fallbackMessage };
};

class RestSupabaseAuth extends AuthBase {
  constructor(private readonly url: string, private readonly anonKey: string) {
    super("castor.supabase.session");
  }

  private async request<T>(path: string, init: RequestInit): Promise<{ data: T | null; error: SupabaseError | null }> {
    try {
      const response = await fetch(`${this.url}${path}`, {
        ...init,
        headers: {
          apikey: this.anonKey,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as T) : (null as T | null);
      if (!response.ok) {
        return {
          data: null,
          error: parseError(payload, `Request failed with status ${response.status}`),
        };
      }

      return { data: payload, error: null };
    } catch (error) {
      return { data: null, error: parseError(error, "Network request failed") };
    }
  }

  private toSession(payload: unknown): SupabaseSession {
    const session = payload as SupabaseSession;
    return session;
  }

  async signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const result = await this.request<SupabaseSession>("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (result.error) {
      return { data: { session: null }, error: result.error };
    }

    const session = this.toSession(result.data);
    this.setSession(session, "SIGNED_IN");
    return { data: { session }, error: null };
  }

  async signUp(input: {
    email: string;
    password: string;
    data?: Record<string, unknown>;
  }): Promise<AuthResponse> {
    const result = await this.request<SupabaseSession>("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (result.error) {
      return { data: { session: null }, error: result.error };
    }

    const session = this.toSession(result.data);
    this.setSession(session, "SIGNED_IN");
    return { data: { session }, error: null };
  }

  async signOut(): Promise<{ error: SupabaseError | null }> {
    const token = this.getAccessToken();
    if (token) {
      await this.request("/auth/v1/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return super.signOut();
  }
}

type MockTableMap = {
  audits: AuditSummary[];
  audit_types: AuditType[];
  audit_type_versions: AuditTypeVersion[];
  organisations: Organisation[];
  profiles: Profile[];
  evidence_submissions: EvidenceSubmission[];
  artifacts: Artifact[];
  findings: Finding[];
  payments: Payment[];
  email_templates: EmailTemplate[];
  runtime_settings: RuntimeSetting[];
  audit_trail: AuditTrailEntry[];
  uploads: UploadSummary[];
  docx_templates: DocxTemplate[];
};

const mockTableData: MockTableMap = {
  audits,
  audit_types: auditTypes,
  audit_type_versions: auditTypeVersions,
  organisations,
  profiles,
  evidence_submissions: evidenceSubmissions,
  artifacts,
  findings,
  payments,
  email_templates: emailTemplates,
  runtime_settings: runtimeSettings,
  audit_trail: auditTrail,
  uploads,
  docx_templates: docxTemplates,
};

class MockQueryBuilder<T extends Record<string, unknown>> implements QueryBuilder<T> {
  private filters: Array<{ column: string; operator: "eq" | "in"; value: unknown }>; // limited operators
  private orderBy: { column: string; ascending: boolean } | null;
  private take: number | null;

  constructor(private readonly table: keyof MockTableMap) {
    this.filters = [];
    this.orderBy = null;
    this.take = null;
  }

  private getRows(): T[] {
    const rows = (mockTableData[this.table] ?? []) as unknown as T[];
    let filtered = [...rows];

    this.filters.forEach(({ column, operator, value }) => {
      if (operator === "eq") {
        filtered = filtered.filter((row) => (row as Record<string, unknown>)[column] === value);
      }
      if (operator === "in" && Array.isArray(value)) {
        filtered = filtered.filter((row) => value.includes((row as Record<string, unknown>)[column]));
      }
    });

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      filtered.sort((a, b) => {
        const av = (a as Record<string, unknown>)[column];
        const bv = (b as Record<string, unknown>)[column];
        if (av === bv) return 0;
        if (av === null || av === undefined) return ascending ? -1 : 1;
        if (bv === null || bv === undefined) return ascending ? 1 : -1;
        if (av > bv) return ascending ? 1 : -1;
        return ascending ? -1 : 1;
      });
    }

    if (this.take !== null) {
      filtered = filtered.slice(0, this.take);
    }

    return JSON.parse(JSON.stringify(filtered));
  }

  async select(): Promise<QueryResult<T>> {
    return { data: this.getRows(), error: null };
  }

  async maybeSingle(): Promise<SingleQueryResult<T>> {
    const rows = this.getRows();
    return { data: rows.length > 0 ? rows[0] : null, error: null };
  }

  async single(): Promise<SingleQueryResult<T>> {
    const rows = this.getRows();
    if (rows.length === 0) {
      return { data: null, error: { message: "Row not found", code: "PGRST116" } };
    }

    return { data: rows[0], error: null };
  }

  eq(column: keyof T | string, value: unknown): QueryBuilder<T> {
    this.filters.push({ column: column as string, operator: "eq", value });
    return this;
  }

  in(column: keyof T | string, values: unknown[]): QueryBuilder<T> {
    this.filters.push({ column: column as string, operator: "in", value: values });
    return this;
  }

  order(column: keyof T | string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this.orderBy = { column: column as string, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.take = count;
    return this;
  }
}

class MockSupabaseAuth extends AuthBase {
  private readonly passwordMap = new Map<string, string>();

  constructor() {
    super("castor.supabase.mock.session");

    profiles.forEach((profile) => {
      this.passwordMap.set(profile.email.toLowerCase(), "Password123!");
    });
  }

  async signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const storedPassword = this.passwordMap.get(credentials.email.toLowerCase());
    if (!storedPassword || storedPassword !== credentials.password) {
      return {
        data: { session: null },
        error: { message: "Invalid email or password", code: "auth.invalid_credentials" },
      };
    }

    const profile = profiles.find((p) => p.email.toLowerCase() === credentials.email.toLowerCase());
    if (!profile) {
      return {
        data: { session: null },
        error: { message: "Profile not found", code: "profile.missing" },
      };
    }

    const session: SupabaseSession = {
      access_token: `mock-token-${profile.user_id}`,
      refresh_token: `mock-refresh-${profile.user_id}`,
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: profile.user_id,
        email: profile.email,
        role: profile.role,
      },
    };

    this.setSession(session, "SIGNED_IN");
    return { data: { session }, error: null };
  }

  async signUp(input: {
    email: string;
    password: string;
    data?: Record<string, unknown>;
  }): Promise<AuthResponse> {
    const existing = profiles.find((profile) => profile.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      return {
        data: { session: null },
        error: { message: "User already exists", code: "auth.user_exists" },
      };
    }

    const newProfile: Profile = {
      id: `profile-${profiles.length + 1}`,
      user_id: `user-${profiles.length + 1}`,
      org_id: (input.data?.org_id as string | undefined) ?? null,
      role: ((input.data?.role as string) ?? "ClientRep") as Profile["role"],
      given_name: (input.data?.given_name as string) ?? "New",
      family_name: (input.data?.family_name as string) ?? "User",
      phone: (input.data?.phone as string | undefined) ?? null,
      status: "Pending",
      email: input.email,
      created_at: new Date().toISOString(),
    };

    profiles.push(newProfile);
    this.passwordMap.set(newProfile.email.toLowerCase(), input.password);

    const session: SupabaseSession = {
      access_token: `mock-token-${newProfile.user_id}`,
      refresh_token: `mock-refresh-${newProfile.user_id}`,
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: newProfile.user_id,
        email: newProfile.email,
        role: newProfile.role,
      },
    };

    this.setSession(session, "SIGNED_IN");
    return { data: { session }, error: null };
  }
}

class MockSupabaseClient implements SupabaseClient {
  auth: SupabaseAuth;

  constructor() {
    this.auth = new MockSupabaseAuth();
  }

  from<T extends Record<string, unknown>>(table: string): QueryBuilder<T> {
    return new MockQueryBuilder<T>(table as keyof MockTableMap);
  }

  async rpc<T>(fn: string, args?: Record<string, unknown>): Promise<RpcResult<T>> {
    if (fn === "get_certificate_by_token") {
      const token = args?.token as string;
      const match = token ? verificationResults[token] : undefined;
      if (!match) {
        return {
          data: null,
          error: { message: "Certificate not found", code: "not_found", status: 404 },
        };
      }

      return { data: match as T, error: null };
    }

    return {
      data: null,
      error: { message: `RPC '${fn}' not implemented in mock client`, code: "not_implemented" },
    };
  }

  functions = {
    invoke: async <T>(name: string, options?: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
    }): Promise<FunctionInvokeResult<T>> => {
      const defaultResponse = {
        status: "queued",
        function: name,
        received_at: new Date().toISOString(),
        request: options?.body ?? null,
      } as T;

      switch (name) {
        case "analysis-run":
        case "process-upload":
        case "pdf-split":
        case "issue-certificate":
        case "import-seed":
        case "renewals-run":
        case "dunning-run":
        case "graph-send":
        case "stripe-webhook":
          return { data: defaultResponse, error: null };
        default:
          return {
            data: null,
            error: { message: `Function '${name}' not implemented`, code: "not_implemented" },
          };
      }
    },
  };
}

class RestQueryBuilder<T extends Record<string, unknown>> implements QueryBuilder<T> {
  private filters: Array<{ column: string; operator: string; value: unknown }> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;

  constructor(
    private readonly table: string,
    private readonly config: { url: string; key: string; tokenProvider: () => string | null }
  ) {}

  private buildQueryParams(columns = "*") {
    const params = new URLSearchParams();
    params.set("select", columns);
    this.filters.forEach(({ column, operator, value }) => {
      if (operator === "in" && Array.isArray(value)) {
        params.append(column, `in.(${value.map((item) => encodeURIComponent(String(item))).join(",")})`);
      } else {
        params.append(column, `${operator}.${encodeURIComponent(String(value))}`);
      }
    });

    if (this.orderBy) {
      params.set("order", `${this.orderBy.column}.${this.orderBy.ascending ? "asc" : "desc"}`);
    }

    if (this.limitValue !== null) {
      params.set("limit", String(this.limitValue));
    }

    return params.toString();
  }

  private buildHeaders(): HeadersInit {
    const token = this.config.tokenProvider();
    return {
      apikey: this.config.key,
      Authorization: token ? `Bearer ${token}` : `Bearer ${this.config.key}`,
      "Content-Type": "application/json",
    };
  }

  private async request(columns?: string): Promise<QueryResult<T>> {
    const query = this.buildQueryParams(columns);
    try {
      const response = await fetch(`${this.config.url}/rest/v1/${this.table}?${query}`, {
        method: "GET",
        headers: this.buildHeaders(),
      });

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as T[]) : [];
      if (!response.ok) {
        return {
          data: null,
          error: parseError(payload, `Failed to load from ${this.table}`),
        };
      }

      return { data: payload, error: null };
    } catch (error) {
      return { data: null, error: parseError(error, "Network request failed") };
    }
  }

  async select(columns?: string): Promise<QueryResult<T>> {
    return this.request(columns);
  }

  async maybeSingle(columns?: string): Promise<SingleQueryResult<T>> {
    const result = await this.request(columns);
    if (result.error) {
      return { data: null, error: result.error };
    }
    const rows = result.data ?? [];
    return { data: rows.length > 0 ? rows[0] : null, error: null };
  }

  async single(columns?: string): Promise<SingleQueryResult<T>> {
    const result = await this.request(columns);
    if (result.error) {
      return { data: null, error: result.error };
    }

    const rows = result.data ?? [];
    if (rows.length === 0) {
      return { data: null, error: { message: "Row not found", code: "PGRST116" } };
    }

    return { data: rows[0], error: null };
  }

  eq(column: keyof T | string, value: unknown): QueryBuilder<T> {
    this.filters.push({ column: column as string, operator: "eq", value });
    return this;
  }

  in(column: keyof T | string, values: unknown[]): QueryBuilder<T> {
    this.filters.push({ column: column as string, operator: "in", value: values });
    return this;
  }

  order(column: keyof T | string, options?: { ascending?: boolean }): QueryBuilder<T> {
    this.orderBy = { column: column as string, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.limitValue = count;
    return this;
  }
}

class RestSupabaseClient implements SupabaseClient {
  auth: SupabaseAuth;

  constructor(private readonly url: string, private readonly anonKey: string) {
    this.auth = new RestSupabaseAuth(url, anonKey);
  }

  from<T extends Record<string, unknown>>(table: string): QueryBuilder<T> {
    return new RestQueryBuilder<T>(table, {
      url: this.url,
      key: this.anonKey,
      tokenProvider: () => this.auth.getAccessToken(),
    });
  }

  async rpc<T>(fn: string, args?: Record<string, unknown>): Promise<RpcResult<T>> {
    try {
      const response = await fetch(`${this.url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.auth.getAccessToken() ?? this.anonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args ?? {}),
      });

      const text = await response.text();
      const payload = text ? (JSON.parse(text) as T) : (null as T | null);
      if (!response.ok) {
        return { data: null, error: parseError(payload, `RPC ${fn} failed`) };
      }

      return { data: payload, error: null };
    } catch (error) {
      return { data: null, error: parseError(error, `RPC ${fn} failed`) };
    }
  }

  functions = {
    invoke: async <T>(name: string, options?: {
      method?: string;
      body?: unknown;
      headers?: Record<string, string>;
    }): Promise<FunctionInvokeResult<T>> => {
      try {
        const response = await fetch(`${this.url}/functions/v1/${name}`, {
          method: options?.method ?? "POST",
          body: options?.body ? JSON.stringify(options.body) : undefined,
          headers: {
            apikey: this.anonKey,
            Authorization: `Bearer ${this.auth.getAccessToken() ?? this.anonKey}`,
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
          },
        });

        const text = await response.text();
        const payload = text ? (JSON.parse(text) as T) : (null as T | null);
        if (!response.ok) {
          return { data: null, error: parseError(payload, `Function ${name} failed`) };
        }

        return { data: payload, error: null };
      } catch (error) {
        return { data: null, error: parseError(error, `Function ${name} failed`) };
      }
    },
  };
}

export const createSupabaseClient = (): SupabaseClient => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    return new RestSupabaseClient(url, anonKey);
  }

  console.warn(
    "Supabase environment variables are not configured. Falling back to mock client for local development.",
  );
  return new MockSupabaseClient();
};

export const supabase = createSupabaseClient();
