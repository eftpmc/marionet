"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NodeView from "@/components/dashboard/NodeView";
import { Node } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Overview() {
  const { data: nodes, mutate, isLoading } = useSWR<Node[]>("/api/nodes", fetcher, {
    refreshInterval: 10000, // auto refresh every 5s
  });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleOpen = (node: Node) => setSelectedNode(node);
  const handleBack = () => setSelectedNode(null);

  const handleCreate = async () => {
    const res = await fetch("/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Node ${(nodes?.length ?? 0) + 1}`,
        description: "Newly created node",
      }),
    });

    if (res.ok) {
      await mutate(); // refresh the list after creation
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/nodes/${id}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(); // refresh the list after deletion
      setSelectedNode(null);
    }
  };

  if (isLoading || !nodes) return <p>Loading nodes...</p>;

  return (
    <div className="p-6">
      {!selectedNode ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overview</h2>
            <Button size="sm" onClick={handleCreate}>
              + Create Node
            </Button>
          </div>

          {nodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No nodes yet. Create one to get started.
            </p>
          ) : (
            <div className="grid gap-4">
              {nodes.map((node) => (
                <Card
                  key={node.id}
                  className="cursor-pointer border-2 hover:bg-secondary-background transition"
                  onClick={() => handleOpen(node)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{node.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {node.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status:{" "}
                      <span
                        className={
                          node.status === "success"
                            ? "text-green-600"
                            : node.status === "error"
                            ? "text-red-600"
                            : node.status === "running"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }
                      >
                        {node.status || "idle"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last run:{" "}
                      {node.lastRun
                        ? new Date(node.lastRun).toLocaleString()
                        : "Never"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <NodeView
          node={selectedNode}
          onBack={handleBack}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}