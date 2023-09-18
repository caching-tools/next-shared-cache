export function normalizeSlug(slug: string): string {
    if (slug.startsWith('200')) {
        return '200';
    } else if (slug.startsWith('404')) {
        return '404';
    } else if (slug.startsWith('alternate')) {
        return 'alternate-200-404';
    }

    return '200';
}
