/** `WorkspaceTask.status` — RALPH_TASK.md / README와 동일 집합 */
export const WORKSPACE_TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
] as const;

export type WorkspaceTaskStatus = (typeof WORKSPACE_TASK_STATUSES)[number];

export function isWorkspaceTaskStatus(s: string): s is WorkspaceTaskStatus {
  return (WORKSPACE_TASK_STATUSES as readonly string[]).includes(s);
}

export const WORKSPACE_TASK_STATUS_LABEL: Record<WorkspaceTaskStatus, string> = {
  backlog: "백로그",
  todo: "할 일",
  in_progress: "진행 중",
  blocked: "막힘",
  done: "완료",
};
