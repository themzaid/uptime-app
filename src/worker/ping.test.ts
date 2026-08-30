import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ping } from './ping';

describe('ping()', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('returns success for a 200 response immediately', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
        }));

        const result = await ping('https://example.com');

        expect(result.isUp).toBe(true);
        expect(result.status).toBe(200);
        expect(typeof result.latency).toBe('number');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 4xx errors and returns immediately', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
        }));

        const result = await ping('https://example.com');

        expect(result.isUp).toBe(false);
        expect(result.status).toBe(404);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('retries up to maxRetries on 5xx errors', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });
        vi.stubGlobal('fetch', fetchMock);

        const pingPromise = ping('https://example.com', 10000, 3);

        for (let i = 0; i < 3; i++) {
            await Promise.resolve(); // flush microtasks
            vi.advanceTimersByTime(3000); // advance by the retry delay
        }

        const result = await pingPromise;

        expect(result.isUp).toBe(false);
        expect(result.status).toBe(500);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('handles timeout (AbortError) and retries', async () => {
        const abortError = new Error('AbortError');
        abortError.name = 'AbortError';
        const fetchMock = vi.fn().mockRejectedValue(abortError);
        vi.stubGlobal('fetch', fetchMock);

        const pingPromise = ping('https://example.com', 10000, 3);

        for (let i = 0; i < 3; i++) {
            await Promise.resolve();
            vi.advanceTimersByTime(3000);
        }

        const result = await pingPromise;

        expect(result.isUp).toBe(false);
        expect(result.status).toBe(408);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('handles network errors and retries', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
        vi.stubGlobal('fetch', fetchMock);

        const pingPromise = ping('https://example.com', 10000, 3);

        for (let i = 0; i < 3; i++) {
            await Promise.resolve();
            vi.advanceTimersByTime(3000);
        }

        const result = await pingPromise;

        expect(result.isUp).toBe(false);
        expect(result.status).toBe(0);
        expect(fetch).toHaveBeenCalledTimes(3);
    });
});
