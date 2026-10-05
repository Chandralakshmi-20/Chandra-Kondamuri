import api from "./api";


// ---------------------------------------------------------
// CURRENT USER
// ---------------------------------------------------------

export const getCurrentUser = async () => {
  const response = await api.get(
    "/api/auth/me"
  );

  return response.data;
};


// ---------------------------------------------------------
// EMPLOYEES
// ---------------------------------------------------------

export const getEmployees = async () => {
  const response = await api.get(
    "/api/employees"
  );

  return response.data;
};


// ---------------------------------------------------------
// PROJECTS
// ---------------------------------------------------------

export const getMyProjects = async () => {
  const response = await api.get(
    "/api/projects"
  );

  return response.data;
};


export const getAllProjects = async () => {
  const response = await api.get(
    "/api/projects/all"
  );

  return response.data;
};


// ---------------------------------------------------------
// WORK REPORTS
// ---------------------------------------------------------

export const getMyWorkReports = async () => {
  const response = await api.get(
    "/api/work-reports"
  );

  return response.data;
};


export const getAllWorkReports = async () => {
  const response = await api.get(
    "/api/work-reports/all"
  );

  return response.data;
};


// ---------------------------------------------------------
// LEAVES
// ---------------------------------------------------------

export const getMyLeaves = async () => {
  const response = await api.get(
    "/api/leaves"
  );

  return response.data;
};


export const getAllLeaves = async () => {
  const response = await api.get(
    "/api/leaves/all"
  );

  return response.data;
};


// ---------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------

export const getNotifications = async () => {
  const response = await api.get(
    "/api/notifications"
  );

  return response.data;
};


// ---------------------------------------------------------
// ATTENDANCE
// ---------------------------------------------------------

export const getMyAttendance = async () => {
  const response = await api.get(
    "/api/attendance"
  );

  return response.data;
};


export const getAllAttendance = async () => {
  const response = await api.get(
    "/api/attendance/all"
  );

  return response.data;
};