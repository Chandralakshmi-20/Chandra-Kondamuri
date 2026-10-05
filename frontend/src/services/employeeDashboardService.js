import api from "./api";

// =========================================================
// GET MY PROJECTS
// Employee can only receive projects assigned to themselves.
// =========================================================
export const getMyProjects = async () => {
  const response = await api.get("/api/projects");

  return response.data;
};


// =========================================================
// GET MY WORK REPORTS
// Employee can only receive their own work reports.
// =========================================================
export const getMyWorkReports = async () => {
  const response = await api.get("/api/work-reports");

  return response.data;
};


// =========================================================
// GET MY LEAVES
// Employee can only receive their own leave requests.
// =========================================================
export const getMyLeaves = async () => {
  const response = await api.get("/api/leaves");

  return response.data;
};