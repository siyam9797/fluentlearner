export const APP_ROLES = [
  "super_admin",
  "admin",
  "staff",
  "mentor",
  "student",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_DEFINITIONS: Record<
  AppRole,
  {
    label: string;
    description: string;
    permissions: string[];
  }
> = {
  super_admin: {
    label: "Super Admin",
    description: "Developer access with complete control of the platform.",
    permissions: [
      "All platform settings",
      "Manage administrators and roles",
      "Manage users and access",
      "All learning and website content",
    ],
  },
  admin: {
    label: "Admin",
    description: "Project owner access for day-to-day business management.",
    permissions: [
      "Manage staff, mentors, and students",
      "Manage courses and batches",
      "Manage enrollments and payments",
      "Manage website content",
    ],
  },
  staff: {
    label: "Staff",
    description: "Operational access for enrollment and student support.",
    permissions: [
      "Review enrollments",
      "Manage students",
      "View courses and batches",
      "Manage learning resources",
    ],
  },
  mentor: {
    label: "Mentor",
    description: "Teaching access for learners, tests, and feedback.",
    permissions: [
      "View assigned students",
      "Manage practice and mock tests",
      "Review mock-test results",
      "Share learning resources",
    ],
  },
  student: {
    label: "Student",
    description: "Learner access to the student dashboard and course tools.",
    permissions: [
      "Take practice and mock tests",
      "View results and feedback",
      "Access batch resources",
      "Manage own profile",
    ],
  },
};

export const DASHBOARD_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "staff",
  "mentor",
];

export function canAccessAdminDashboard(role: string | null | undefined) {
  return DASHBOARD_ROLES.includes(role as AppRole);
}

export function canManageUsers(role: string | null | undefined) {
  return role === "super_admin" || role === "admin";
}
