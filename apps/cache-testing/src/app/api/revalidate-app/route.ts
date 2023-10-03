import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function GET(request: NextRequest): Promise<NextResponse> {
    const path = request.nextUrl.searchParams.get('path');
    const tag = request.nextUrl.searchParams.get('tag');

    const now = new Date().toLocaleTimeString('ru-RU', {
        fractionalSecondDigits: 3,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    if (path) {
        revalidatePath(path);
        return Promise.resolve(
            NextResponse.json({
                revalidated: true,
                now,
            }),
        );
    }

    if (tag) {
        revalidateTag(tag);
        return Promise.resolve(
            NextResponse.json({
                revalidated: true,
                now,
            }),
        );
    }

    return Promise.resolve(
        NextResponse.json({
            revalidated: false,
            now,
            message: 'Missing path to revalidate',
        }),
    );
}
