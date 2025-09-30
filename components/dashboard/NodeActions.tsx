"use client";

import { useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select"
import { Trash, Plus, GripVertical, Copy, Edit, X } from "lucide-react";
import { Action } from "@/types";

interface NodeActionsProps {
    nodeId: number;
    initialActions?: Action[];
}

export default function NodeActions({ nodeId, initialActions = [] }: NodeActionsProps) {
    const [actions, setActions] = useState<Action[]>(initialActions);
    const [type, setType] = useState("goto");
    const [value, setValue] = useState("");

    // dnd-kit setup
    const sensors = useSensors(useSensor(PointerSensor));

    const addAction = async () => {
        let body: any;
        if (type === "goto") body = { type, url: value };
        else if (type === "click") body = { type, selector: value };
        else if (type === "type")
            body = { type, selector: value.split("|")[0], value: value.split("|")[1] || "" };
        else if (type === "waitForSelector") body = { type, selector: value };
        else if (type === "wait") {
            const [min, max] = value.split("|").map((v) => parseInt(v, 10));
            body = { type, min, max };
        } else return;

        const res = await fetch(`/api/nodes/${nodeId}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            const newAction = await res.json();
            setActions((prev) => [...prev, newAction]);
            setValue("");
        }
    };

    const deleteAction = async (id: number) => {
        const res = await fetch(`/api/nodes/${nodeId}/actions/${id}`, { method: "DELETE" });
        if (res.ok) {
            setActions((prev) => prev.filter((a) => a.id !== id));
        }
    };

    const duplicateAction = async (action: Action) => {
        // make a shallow copy without reusing the same id
        const { id, ...rest } = action;

        const res = await fetch(`/api/nodes/${nodeId}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rest),
        });

        if (res.ok) {
            const newAction = await res.json();
            setActions((prev) => [...prev, newAction]);
        }
    };

    const renderActionLabel = (a: Action): React.ReactNode => {
        let full = "";
        let short = a.type;

        switch (a.type) {
            case "goto":
                full = `Goto → ${a.url}`;
                break;
            case "click":
                full = `Click → ${a.selector}`;
                break;
            case "type":
                full = `Type "${a.value}" → ${a.selector}`;
                break;
            case "waitForSelector":
                full = `Wait for → ${a.selector}`;
                break;
            case "wait":
                full = `Wait → ${"min" in a ? a.min : "?"}–${"max" in a ? a.max : "?"}ms`;
                break;
        }

        return (
            <>
                {/* Full label for md+ screens */}
                <span className="hidden md:inline">{full}</span>
                {/* Short label for mobile */}
                <span className="inline md:hidden capitalize">{short}</span>
            </>
        );
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (!over) return;
        if (active.id !== over.id) {
            setActions((prev) => {
                const oldIndex = prev.findIndex((a) => a.id === active.id);
                const newIndex = prev.findIndex((a) => a.id === over.id);
                const reordered = arrayMove(prev, oldIndex, newIndex);

                fetch(`/api/nodes/${nodeId}/actions/reorder`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ actions: reordered.map((a) => a.id) }),
                }).catch(console.error);

                return reordered;
            });
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {actions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No actions yet.</p>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext
                            items={actions.map((a) => a.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul className="space-y-2">
                                {actions.map((a) => (
                                    <SortableActionItem
                                        key={a.id}
                                        action={a}
                                        renderActionLabel={renderActionLabel}
                                        onDelete={() => deleteAction(a.id)}
                                        onDuplicate={() => duplicateAction(a)}
                                    />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}

                {/* Add Action Form */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <Label>Action Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v)}>
                            <SelectTrigger className="w-[200px] text-sm">
                                <SelectValue placeholder="Select action type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="goto">Goto (url)</SelectItem>
                                <SelectItem value="click">Click (selector)</SelectItem>
                                <SelectItem value="type">Type (selector + value)</SelectItem>
                                <SelectItem value="waitForSelector">Wait for Selector</SelectItem>
                                <SelectItem value="wait">Wait (min + max)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === "goto" && (
                        <div className="flex flex-col">
                            <Label>URL</Label>
                            <Input
                                placeholder="https://example.com"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    )}

                    {type === "click" && (
                        <div className="flex flex-col">
                            <Label>Selector</Label>
                            <Input
                                placeholder=".btn-primary"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    )}

                    {type === "type" && (
                        <div className="flex gap-2">
                            <div className="flex flex-col flex-1">
                                <Label>Selector</Label>
                                <Input
                                    placeholder="#input-email"
                                    value={value.split("|")[0] || ""}
                                    onChange={(e) =>
                                        setValue(`${e.target.value}|${value.split("|")[1] || ""}`)
                                    }
                                    className="text-sm"
                                />
                            </div>
                            <div className="flex flex-col flex-1">
                                <Label>Value</Label>
                                <Input
                                    placeholder="hello@example.com"
                                    value={value.split("|")[1] || ""}
                                    onChange={(e) =>
                                        setValue(`${value.split("|")[0] || ""}|${e.target.value}`)
                                    }
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {type === "waitForSelector" && (
                        <div className="flex flex-col">
                            <Label>Selector</Label>
                            <Input
                                placeholder=".loaded"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    )}

                    {type === "wait" && (
                        <div className="flex gap-2">
                            <div className="flex flex-col flex-1">
                                <Label>Min (ms)</Label>
                                <Input
                                    type="number"
                                    placeholder="1000"
                                    value={value.split("|")[0] || ""}
                                    onChange={(e) =>
                                        setValue(`${e.target.value}|${value.split("|")[1] || ""}`)
                                    }
                                    className="text-sm"
                                />
                            </div>
                            <div className="flex flex-col flex-1">
                                <Label>Max (ms)</Label>
                                <Input
                                    type="number"
                                    placeholder="5000"
                                    value={value.split("|")[1] || ""}
                                    onChange={(e) =>
                                        setValue(`${value.split("|")[0] || ""}|${e.target.value}`)
                                    }
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <Button size="sm" onClick={addAction}>
                        <Plus className="w-4 h-4 mr-1" /> Add Action
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function SortableActionItem({
    action,
    renderActionLabel,
    onDelete,
    onDuplicate,
}: {
    action: Action;
    renderActionLabel: (a: Action) => React.ReactNode;
    onDelete: () => void;
    onDuplicate: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: action.id,
    });

    const [isEditing, setIsEditing] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className="flex justify-between items-center border border-border rounded px-3 py-2 text-sm bg-muted/40"
        >
            <div className="flex items-center gap-2">
                <span {...attributes} {...listeners} className="cursor-grab">
                    <GripVertical className="h-4 w-4 text-gray-500" />
                </span>
                <span className="whitespace-nowrap text-ellipsis">{renderActionLabel(action)}</span>
            </div>

            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <Button size="sm" variant="neutral" onClick={onDuplicate}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="neutral" onClick={onDelete}>
                            <Trash className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="neutral" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button size="sm" variant="neutral" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </li>
    );
}
