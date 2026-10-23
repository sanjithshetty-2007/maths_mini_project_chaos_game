// Calls to the Python backend (api.py). Next.js forwards /api/* to FastAPI.

export type TaskMeta = {
  id: number;
  title: string;
  text: string;
  question: string | null;
  variables: string[];
  code: string;
};

export type Project = {
  title: string;
  goals: string;
  introduction: string;
  commands: string;
  submit: string;
  tasks: TaskMeta[];
};

export type PlotLine = {
  label: string | null;
  color: string;
  marker: string;
  markersize: number;
  x: number[];
  y: number[];
};

export type TaskRun = {
  id: number;
  ratio: number | null;
  seconds: number;
  printed: string;
  variables: Record<string, unknown>;
  plot: { title: string; lines: PlotLine[] } | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* not JSON */
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export const getHealth = () => request<{ ok: boolean; cells: number }>("/api/health");

export const getProject = () => request<Project>("/api/project");

export const runTask = (id: number, ratio?: number) =>
  request<TaskRun>(`/api/tasks/${id}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ratio === undefined ? {} : { ratio }),
  });
