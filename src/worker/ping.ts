// src/worker/ping.ts

export interface PingResult {
    isUp: boolean;
    status: number;
    latency: number | null; // in milliseconds
}

export async function ping(url: string, timeoutMs: number = 10000, maxRetries: number = 3): Promise<PingResult> {
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
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

            // If it's a success, or a 4xx client error (meaning the server is actually up and responding),
            // there is no need to retry. We can return immediately.
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return {
                    isUp: response.ok,
                    status: response.status,
                    latency,
                };
            }

            // If we've exhausted all retries (e.g. it kept returning 500/503), return the final result
            if (attempt >= maxRetries) {
                return {
                    isUp: response.ok,
                    status: response.status,
                    latency,
                };
            }
        } catch (error: unknown) {
            const latency = Date.now() - start;
            clearTimeout(timeoutId);

            // If we've exhausted all retries on network failures or timeouts, return the failure
            if (attempt >= maxRetries) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return {
                        isUp: false,
                        status: 408, // Request Timeout
                        latency,
                    };
                }

                return {
                    isUp: false,
                    status: 0, // 0 indicates a network/DNS error (no response)
                    latency: null, // Hard network failures shouldn't skew latency graphs
                };
            }
        }

        // Wait 3 seconds before retrying to give the network (or server) a chance to recover
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Fallback (should never technically hit this due to the returns inside the loop)
    return { isUp: false, status: 0, latency: null };
}
