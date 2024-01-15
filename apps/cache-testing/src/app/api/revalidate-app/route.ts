import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { formatTime } from 'cache-testing/utils/format-time';

export function GET(request: NextRequest): Promise<NextResponse> {
    const path = request.nextUrl.searchParams.get('path');
    const tag = request.nextUrl.searchParams.get('tag');

    const time = formatTime(Date.now(), 3);

    if (path) {
        revalidatePath(path);
        return Promise.resolve(
            NextResponse.json({
                revalidated: true,
                now: time,
            }),
        );
    }

    if (tag) {
        revalidateTag(tag);
        return Promise.resolve(
            NextResponse.json({
                revalidated: true,
                now: time,
            }),
        );
    }

    return Promise.resolve(
        NextResponse.json({
            revalidated: false,
            now: time,
            message: 'Missing path to revalidate',
        }),
    );
}
