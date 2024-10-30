export type PageProps = { count: number; time: number; revalidateAfter: number; path: string };

export type WorldTimeApiResponseJson = { unixtime: number };

export type TimeBackendApiResponseJson = { unixTimeMs: number };

export type CountBackendApiResponseJson = { count: number; unixTimeMs: number };

export type RandomHexBackendApiResponseJson = { randomHex: number; unixTimeMs: number };

export type RandomHexPageProps = RandomHexBackendApiResponseJson;
