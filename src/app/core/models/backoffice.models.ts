export type ProjectStatus = 'Planning' | 'Ongoing' | 'Completed' | 'On Hold';
export type AttendanceStatus = 'Present' | 'Remote' | 'Absent' | 'Unassigned';

export interface Project {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  startDate: string;
  expectedCompletionDate: string;
  materials: string;
  budget: number;
  notes: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  assignedProjectId: string;
  projectName?: string;
  attendanceStatus: AttendanceStatus;
  lastLog: string;
}

export interface Asset {
  id: string;
  projectId: string;
  projectName?: string;
  fileName: string;
  originalName: string;
  fileType: 'Image' | 'Document';
  category: string;
  description: string;
  uploadedAt: string;
  url: string;
}

export interface DashboardStats {
  totalProjects: number;
  ongoingProjects: number;
  completedProjects: number;
  planningProjects: number;
  activeWorkers: number;
  totalAssets: number;
}

export interface WorkerAllocation {
  projectId: string;
  projectName: string;
  count: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentProjects: Project[];
  workerAllocation: WorkerAllocation[];
}
