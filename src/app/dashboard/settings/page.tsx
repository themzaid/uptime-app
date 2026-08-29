'use client';

import { useEffect, useState } from 'react';
import { getUserSettings, updateUserSettings } from '../../../actions/settings';
import { Card, Title, Text, NumberInput, Switch, Button } from '@tremor/react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [cooldown, setCooldown] = useState(15);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [slackEnabled, setSlackEnabled] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            const settings = await getUserSettings();
            setCooldown(settings.alertCooldown);
            setEmailEnabled(settings.emailAlertsEnabled);
            setSlackEnabled(settings.slackAlertsEnabled);
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
        });
        setSaving(false);
        alert('Settings saved successfully!');
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-500">Manage your alert preferences and throttling rules.</p>
            </div>

            <Card className="mb-6">
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

            <Card className="mb-6">
                <Title>Notification Channels</Title>
                <Text className="mb-6">Choose how you want to receive alerts when incidents occur.</Text>

                <div className="flex items-center justify-between mb-4 max-w-md p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <p className="font-medium text-gray-900">Email Alerts</p>
                        <p className="text-sm text-gray-500">Receive an email when a monitor goes down or recovers.</p>
                    </div>
                    <Switch checked={emailEnabled} onChange={setEmailEnabled} />
                </div>

                <div className="flex items-center justify-between max-w-md p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                        <p className="font-medium text-gray-900">Slack Alerts</p>
                        <p className="text-sm text-gray-500">Send webhook notifications to Slack.</p>
                    </div>
                    <Switch checked={slackEnabled} onChange={setSlackEnabled} />
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
