export function GET(): Promise<Response> {
  return Promise.resolve(new Response('OK', { status: 200 }));
}
