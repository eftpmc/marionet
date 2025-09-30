"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import NodeActions from "@/components/dashboard/NodeActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Node } from "@/types";
import { Save, Play, Cookie, ChevronLeft, Trash, Monitor } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NodeViewProps {
    node: Node;
    onBack: () => void;
    onDelete: (id: number) => void;
}

export default function NodeView({ node, onBack, onDelete }: NodeViewProps) {
    const { data: freshNode, mutate } = useSWR<Node>(
        `/api/nodes/${node.id}`,
        fetcher,
        {
            refreshInterval: 10000,
            fallbackData: node,
        }
    );

    const [baseUrl, setBaseUrl] = useState(freshNode?.baseUrl || "");
    const [screenshotUrl, setScreenshotUrl] = useState(
        `/api/nodes/${node.id}/screenshot`
    );
    const [isRunning, setIsRunning] = useState(false);

    const [unit, setUnit] = useState<"seconds" | "minutes" | "hours" | "days">("minutes");
    const [intervalValue, setIntervalValue] = useState(1);

    const unitToMs = {
        seconds: 1000,
        minutes: 60_000,
        hours: 3_600_000,
        days: 86_400_000,
    };

    useEffect(() => {
        if (freshNode?.intervalMs) {
            if (freshNode.intervalMs >= unitToMs.days) {
                setUnit("days");
                setIntervalValue(Math.round(freshNode.intervalMs / unitToMs.days));
            } else if (freshNode.intervalMs >= unitToMs.hours) {
                setUnit("hours");
                setIntervalValue(Math.round(freshNode.intervalMs / unitToMs.hours));
            } else if (freshNode.intervalMs >= unitToMs.minutes) {
                setUnit("minutes");
                setIntervalValue(Math.round(freshNode.intervalMs / unitToMs.minutes));
            } else {
                setUnit("seconds");
                setIntervalValue(Math.round(freshNode.intervalMs / unitToMs.seconds));
            }
        }
    }, [freshNode]);

    const refreshScreenshot = () => {
        setScreenshotUrl(`/api/nodes/${node.id}/screenshot?${Date.now()}`);
    };

    const saveBaseUrl = async () => {
        await fetch(`/api/nodes/${node.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseUrl }),
        });
        mutate();
    };

    const runNode = async () => {
        setIsRunning(true);
        if (freshNode) {
            mutate({ ...freshNode, status: "running" }, false);
        }

        await fetch(`/api/nodes/${node.id}/run`, { method: "POST" });
        setIsRunning(false);
        mutate();
    };

    if (!freshNode) return <p>Loading...</p>;

    const updateInterval = async (val: number, currentUnit = unit) => {
        setIntervalValue(val);
        const intervalMs = val * unitToMs[currentUnit];
        await fetch(`/api/nodes/${node.id}/auto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                enabled: freshNode?.autoRunEnabled || false,
                intervalMs,
            }),
        });
        mutate();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{freshNode.name}</h2>
                <div className="flex gap-2">
                    <Button size="icon" onClick={onBack}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                size="icon"
                                variant="neutral"
                                onClick={refreshScreenshot}
                            >
                                <Monitor className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Job Monitoring</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                                <img
                                    src={screenshotUrl}
                                    alt="Live Screenshot"
                                    className="border rounded w-full"
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button
                        size="icon"
                        variant="neutral"
                        onClick={() => onDelete(node.id)}
                    >
                        <Trash className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Status + Controls */}
            <Card>
                <CardContent className="flex items-center justify-between py-4">
                    <div className="text-sm space-y-1">
                        <p>
                            <span className="font-semibold">Status:</span>{" "}
                            <span
                                className={
                                    freshNode.status === "success"
                                        ? "text-green-600"
                                        : freshNode.status === "error"
                                            ? "text-red-600"
                                            : freshNode.status === "running"
                                                ? "text-blue-600"
                                                : "text-gray-500"
                                }
                            >
                                {freshNode.status || "idle"}
                            </span>
                        </p>
                        <p>
                            <span className="font-semibold">Last run:</span>{" "}
                            {freshNode.lastRun
                                ? new Date(freshNode.lastRun).toLocaleString()
                                : "Never"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            id={`cookie-upload-${node.id}`}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={async (e) => {
                                if (!e.target.files?.length) return;
                                const file = e.target.files[0];
                                const formData = new FormData();
                                formData.append("cookies", file);

                                const res = await fetch(`/api/nodes/${node.id}/cookies`, {
                                    method: "POST",
                                    body: formData,
                                });

                                if (res.ok) {
                                    alert("Cookies uploaded successfully!");
                                    mutate();
                                } else {
                                    const data = await res.json();
                                    alert("Upload failed: " + data.error);
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            variant="neutral"
                            onClick={() =>
                                document.getElementById(
                                    `cookie-upload-${node.id}`
                                )?.click()
                            }
                        >
                            <Cookie className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            onClick={runNode}
                            disabled={isRunning || freshNode.status === "running"}
                        >
                            {isRunning || freshNode.status === "running" ? (
                                <span className="animate-spin border-2 border-gray-300 border-t-transparent rounded-full w-4 h-4" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {/* Base URL */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://example.com"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                        />
                        <Button size="icon" onClick={saveBaseUrl} variant="neutral">
                            <Save className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Auto Run */}
                    {/* Scheduler */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Scheduler</span>
                            <Switch
                                checked={freshNode.autoRunEnabled || false}
                                onCheckedChange={async (enabled) => {
                                    await fetch(`/api/nodes/${node.id}/auto`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            enabled,
                                            intervalMs: intervalValue * unitToMs[unit],
                                        }),
                                    });
                                    mutate();
                                }}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm">Run every</span>
                            <Input
                                type="number"
                                className="w-20"
                                value={intervalValue}
                                min={1}
                                step={1}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 1;
                                    updateInterval(val, unit);
                                }}
                            />
                            <Select
                                value={unit}
                                onValueChange={(v) => {
                                    setUnit(v as any);
                                    updateInterval(intervalValue, v as any);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="seconds">Seconds</SelectItem>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {freshNode.autoRunEnabled && freshNode.lastRun && (
                            <p className="text-xs text-gray-500">
                                Next run:{" "}
                                {new Date(
                                    new Date(freshNode.lastRun).getTime() +
                                    intervalValue * unitToMs[unit]
                                ).toLocaleString()}
                            </p>
                        )}
                    </div>

                </CardContent>
            </Card>

            <NodeActions
                nodeId={node.id}
                initialActions={freshNode.actions || []}
            />
        </div>
    );
}