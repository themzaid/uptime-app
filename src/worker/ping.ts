// src/worker/ping.ts

export interface PingResult {
    isUp: boolean;
    status: number;
    latency: number; // in milliseconds
}

export async function ping(url: string, timeoutMs: number = 10000): Promise<PingResult> {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            // Some sites might block bots, a basic user-agent can help
            headers: {
                'User-Agent': 'UptimeMonitor/1.0',
            },
        });

        const latency = Date.now() - start;
        clearTimeout(timeoutId);

        return {
            isUp: response.ok,
            status: response.status,
            latency,
        };
    } catch (error: any) {
        const latency = Date.now() - start;
        clearTimeout(timeoutId);

        // If it's an abort error, we know it timed out
        if (error.name === 'AbortError') {
            return {
                isUp: false,
                status: 408, // Request Timeout
                latency,
            };
        }

        return {
            isUp: false,
            status: 0, // 0 indicates a network/DNS error (no response)
            latency,
        };
    }
}
