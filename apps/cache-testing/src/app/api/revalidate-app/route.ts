import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function GET(request: NextRequest): Promise<NextResponse> {
    const path = request.nextUrl.searchParams.get('path');
    const tag = request.nextUrl.searchParams.get('tag');

    if (path) {
        revalidatePath(path);
        return Promise.resolve(NextResponse.json({ revalidated: true, now: Date.now() }));
    }

    if (tag) {
        revalidateTag(tag);
        return Promise.resolve(NextResponse.json({ revalidated: true, now: Date.now() }));
    }

    return Promise.resolve(
        NextResponse.json({
            revalidated: false,
            now: Date.now(),
            message: 'Missing path to revalidate',
        }),
    );
}
