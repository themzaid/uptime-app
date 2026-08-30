export function shouldResolveIncident(isUp: boolean, hasOpenIncident: boolean): boolean {
    return isUp && hasOpenIncident;
}

export function shouldOpenIncident(
    recentChecks: { statusCode: number | null }[],
    hasOpenIncident: boolean
): boolean {
    if (hasOpenIncident) return false;

    return recentChecks.length === 3 && recentChecks.every(
        c => c.statusCode === 0 || (c.statusCode !== null && c.statusCode >= 400)
    );
}

export function shouldSendAlert(
    lastIncident: { openedAt: Date | string, alertSent: boolean } | undefined | null,
    alertCooldownMinutes: number,
    now: Date = new Date()
): boolean {
    if (!lastIncident || !lastIncident.alertSent) return true;

    const openedAt = typeof lastIncident.openedAt === 'string'
        ? new Date(lastIncident.openedAt)
        : lastIncident.openedAt;

    const minutesSinceLastAlert = (now.getTime() - openedAt.getTime()) / (1000 * 60);
    return minutesSinceLastAlert >= alertCooldownMinutes;
}
