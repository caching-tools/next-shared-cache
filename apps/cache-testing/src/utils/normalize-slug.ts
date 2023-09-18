export function normalizeSlug(slug: string): string {
    if (slug.includes('200')) {
        return '200';
    } else if (slug.includes('404')) {
        return '404';
    } else if (slug.includes('alternate')) {
        return 'alternate-200-404';
    }

    return '200';
}
