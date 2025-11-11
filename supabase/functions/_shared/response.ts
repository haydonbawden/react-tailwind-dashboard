export interface JsonResponse<T> {
  data: T | null;
  error: { code: string; message: string; refId?: string } | null;
}

export function ok<T>(payload: T): Response {
  return new Response(JSON.stringify({ data: payload, error: null }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export function fail(message: string, code = "internal_error", status = 500): Response {
  return new Response(JSON.stringify({ data: null, error: { code, message } }), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

export const methodNotAllowed = () =>
  fail("Method not allowed", "method_not_allowed", 405);
