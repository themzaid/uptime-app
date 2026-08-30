import { describe, it, expect } from 'vitest';
import { shouldResolveIncident, shouldOpenIncident, shouldSendAlert } from './incident-logic';

describe('incident-logic', () => {
    describe('shouldResolveIncident()', () => {
        it('resolves if site is UP and there is an open incident', () => {
            expect(shouldResolveIncident(true, true)).toBe(true);
        });

        it('does nothing if site is UP but there is NO open incident', () => {
            expect(shouldResolveIncident(true, false)).toBe(false);
        });

        it('does nothing if site is DOWN', () => {
            expect(shouldResolveIncident(false, true)).toBe(false);
        });
    });

    describe('shouldOpenIncident()', () => {
        it('does not open if there is already an open incident', () => {
            expect(shouldOpenIncident([{ statusCode: 500 }, { statusCode: 500 }, { statusCode: 500 }], true)).toBe(false);
        });

        it('does not open if there are fewer than 3 checks', () => {
            expect(shouldOpenIncident([{ statusCode: 500 }, { statusCode: 500 }], false)).toBe(false);
        });

        it('opens if there are exactly 3 checks and all failed (500)', () => {
            expect(shouldOpenIncident([{ statusCode: 500 }, { statusCode: 500 }, { statusCode: 500 }], false)).toBe(true);
        });

        it('opens if there are exactly 3 checks and all are network errors (0)', () => {
            expect(shouldOpenIncident([{ statusCode: 0 }, { statusCode: 0 }, { statusCode: 0 }], false)).toBe(true);
        });

        it('does not open if one check passed (200)', () => {
            expect(shouldOpenIncident([{ statusCode: 500 }, { statusCode: 200 }, { statusCode: 500 }], false)).toBe(false);
        });
    });

    describe('shouldSendAlert()', () => {
        const now = new Date('2026-08-30T10:00:00Z');

        it('sends alert if there is no last incident', () => {
            expect(shouldSendAlert(null, 15, now)).toBe(true);
        });

        it('sends alert if the last incident did not send an alert', () => {
            expect(shouldSendAlert({ openedAt: new Date(), alertSent: false }, 15, now)).toBe(true);
        });

        it('sends alert if cooldown has passed', () => {
            const openedAt = new Date('2026-08-30T09:30:00Z'); // 30 mins ago
            expect(shouldSendAlert({ openedAt, alertSent: true }, 15, now)).toBe(true);
        });

        it('throttles alert if cooldown has NOT passed', () => {
            const openedAt = new Date('2026-08-30T09:50:00Z'); // 10 mins ago
            expect(shouldSendAlert({ openedAt, alertSent: true }, 15, now)).toBe(false);
        });

        it('handles string dates gracefully', () => {
            const openedAtStr = '2026-08-30T09:50:00Z';
            expect(shouldSendAlert({ openedAt: openedAtStr, alertSent: true }, 15, now)).toBe(false);
        });
    });
});
