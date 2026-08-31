'use client';

import { useEffect, useState } from 'react';
import { getUserSettings, updateUserSettings } from '../../../actions/settings';
import { Card, Title, Text, NumberInput, Button, Grid, Col, Metric } from '@tremor/react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [cooldown, setCooldown] = useState(15);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [slackEnabled, setSlackEnabled] = useState(true);
    const [dataRetentionDays, setDataRetentionDays] = useState(30);
    const [stats, setStats] = useState({ monitorsCount: 0, checksPerDay: 0 });

    useEffect(() => {
        async function fetchSettings() {
            const settings = await getUserSettings();
            setCooldown(settings.alertCooldown);
            setEmailEnabled(settings.emailAlertsEnabled);
            setSlackEnabled(settings.slackAlertsEnabled);
            setDataRetentionDays(settings.dataRetentionDays || 30);
            setStats(settings.stats || { monitorsCount: 0, checksPerDay: 0 });
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updateUserSettings({
            alertCooldown: cooldown,
            emailAlertsEnabled: emailEnabled,
            slackAlertsEnabled: slackEnabled,
            dataRetentionDays: dataRetentionDays,
        });
        setSaving(false);
        alert('Settings saved successfully!');
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    const isDevelopment = process.env.NODE_ENV === 'development';

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-500">Manage your alert preferences, data retention, and view limits.</p>
            </div>

            <Card>
                <Title>Free Tier Usage Limits</Title>
                <Text className="mb-6">
                    Estimates based on your current monitors. Keep checks below 1,000/day to stay within the free Upstash Redis limit. Neon Postgres allows up to 500MB of storage.
                </Text>
                
                <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
                    {/* Redis Limitations */}
                    <Col>
                        <Text>Daily Redis Operations (Max ~1,000)</Text>
                        <Metric>{stats.checksPerDay} <span className="text-sm text-gray-500 font-normal">checks/day</span></Metric>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3 overflow-hidden">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-500 ${isDevelopment ? 'bg-emerald-500' : (stats.checksPerDay > 800 ? 'bg-red-500' : 'bg-emerald-500')}`} 
                                style={{ width: `${Math.min((stats.checksPerDay / 1000) * 100, 100)}%` }}
                            ></div>
                        </div>
                        {isDevelopment && (
                            <Text className="mt-2 text-xs text-amber-600 font-medium">Local environment detected. Free tier limits do not apply.</Text>
                        )}
                        {!isDevelopment && stats.checksPerDay > 1000 && (
                            <Text className="mt-2 text-xs text-red-500 font-medium">Warning: You are exceeding the Upstash free tier limit!</Text>
                        )}
                    </Col>
                    <Col>
                        <Text>Database Storage Estimate</Text>
                        <Metric>~{(stats.checksPerDay * dataRetentionDays).toLocaleString()} <span className="text-sm text-gray-500 font-normal">rows retained</span></Metric>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3 overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(((stats.checksPerDay * dataRetentionDays) / 5000000) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <Text className="mt-2 text-xs text-gray-500">500MB limit allows roughly 5 million rows.</Text>
                    </Col>

                    {/* Resend Email Limitations */}
                    <Col>
                        <Text>Daily Email Alerts (Max 100)</Text>
                        <Metric>~{(stats.checksPerDay / 100).toFixed(0)} <span className="text-sm text-gray-500 font-normal">emails/day (est.)</span></Metric>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3 overflow-hidden">
                            <div 
                                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min((((stats.checksPerDay / 100) / 100) * 100), 100)}%` }}
                            ></div>
                        </div>
                        <Text className="mt-2 text-xs text-gray-500">Resend free tier allows 100 emails per day.</Text>
                    </Col>

                    {/* Fly.io Worker Limitations */}
                    <Col>
                        <Text>Worker Memory Allocation</Text>
                        <Metric>256 <span className="text-sm text-gray-500 font-normal">MB</span></Metric>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3 overflow-hidden">
                            <div 
                                className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: '100%' }}
                            ></div>
                        </div>
                        <Text className="mt-2 text-xs text-gray-500">Fly.io free tier allows up to 256MB RAM per VM.</Text>
                    </Col>
                </Grid>
            </Card>

            <Card>
                <Title>Data Retention</Title>
                <Text className="mb-4">
                    Automatically delete old ping results to save database storage space. The worker will clean up old records during each check.
                </Text>

                <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period (Days)</label>
                    <NumberInput
                        value={dataRetentionDays}
                        onValueChange={(val) => setDataRetentionDays(val || 30)}
                        min={1}
                        max={365}
                        step={1}
                    />
                </div>
            </Card>

            <Card>
                <Title>Alert Throttling</Title>
                <Text className="mb-4">
                    Set a cooldown period (in minutes) to prevent getting spammed when a monitor is rapidly flapping up and down. Industry standard is 15-30 minutes.
                </Text>

                <div className="max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cooldown Period (Minutes)</label>
                    <NumberInput
                        value={cooldown}
                        onValueChange={(val) => setCooldown(val || 15)}
                        min={0}
                        max={1440}
                        step={1}
                    />
                </div>
            </Card>

            <Card>
                <Title>Notification Channels</Title>
                <Text className="mb-6">Choose how you want to receive alerts when incidents occur.</Text>

                <div className="flex items-center justify-between mb-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div>
                        <p className="font-semibold text-gray-900">Email Alerts</p>
                        <p className="text-sm text-gray-500">Receive an email when a monitor goes down or recovers.</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={emailEnabled}
                        onClick={() => setEmailEnabled(!emailEnabled)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            emailEnabled ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                emailEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                <div className="flex items-center justify-between p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div>
                        <p className="font-semibold text-gray-900">Slack Alerts</p>
                        <p className="text-sm text-gray-500">Send webhook notifications to Slack.</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={slackEnabled}
                        onClick={() => setSlackEnabled(!slackEnabled)}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent p-0 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                            slackEnabled ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                slackEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </Card>

            <div className="flex justify-end mt-6">
                <Button onClick={handleSave} loading={saving} size="lg">
                    Save Settings
                </Button>
            </div>
        </div>
    );
}
