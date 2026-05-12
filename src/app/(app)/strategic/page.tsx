import { listStrategicTasks } from "@/actions/strategic";
import { StrategicBoard } from "@/components/strategic/StrategicBoard";
import { StrategicNewForm } from "@/components/strategic/StrategicNewForm";

export default async function StrategicPage() {
  const res = await listStrategicTasks({});
  const tasks = "tasks" in res ? res.tasks : [];
  const error = "error" in res ? res.error : undefined;
  const boardId = "boardId" in res ? res.boardId : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Planejamento estratégico</h1>
      {error && <p className="text-amber-300 text-sm">{error}</p>}
      <StrategicNewForm boardId={boardId} />
      <StrategicBoard tasks={tasks} />
    </div>
  );
}
