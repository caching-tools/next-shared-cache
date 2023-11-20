export function normalizeSlug(slug = ''): string {
    switch (slug) {
        case '404':
        case 'alternate-200-404':
            return slug;
        default:
            return '200';
    }
}
