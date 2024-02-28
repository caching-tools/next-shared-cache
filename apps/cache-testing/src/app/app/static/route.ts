export function GET() {
    return Promise.resolve(new Response('OK', { status: 200 }));
}
