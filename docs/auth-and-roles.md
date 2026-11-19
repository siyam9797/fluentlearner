# Authentication and roles

## Sessions

- **Login:** `auth.login` with email and password. The password is checked against `app_users.passwordHash`, which uses scrypt with a random salt (`scrypt:<salt>:<hash>`, compared in constant time; see `server/_core/password.ts`). Inactive accounts can't sign in.
- **Cookie:** `app_session_id`, an HS256 JWT signed with `JWT_SECRET` (`server/_core/session.ts`). The cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production. App sessions last one year, local dev-admin sessions one day.
- **Every request** re-reads the user from `app_users`, so deactivating an account or changing its role takes effect immediately. Each authenticated request also updates `lastSignedIn`.
- **Logout:** `auth.logout` clears the cookie.
- **Change password:** `auth.changePassword`. Any signed-in database account (every role) can change its own password after confirming the current one. The form is on **Admin → Settings → Security** and **Student → Settings**. Other sessions stay signed in. The dev login's password comes from `.env` and can't be changed this way. Admins reset _other_ people's passwords in **Admin → Users**.
- **Dev administrator:** when `NODE_ENV` is not `production`, signing in with `LOCAL_ADMIN_EMAIL` / `LOCAL_ADMIN_PASSWORD` (default `admin@localhost.test` / `admin12345`) issues a "local" session that acts as Super Admin (`openId: "local:admin"`). In production these tokens are rejected even if presented.
- **After online payment,** a newly created student account is signed in automatically. See [payments.md](payments.md).

`/admin` and `/student` each show their own login screen, but both call the same `auth.login`.

## Roles

Defined in `shared/roles.ts` (labels and descriptions shown on **Admin → Roles**) and as the `role` enum in the database.

| Role          | Intended for                                                                              |
| ------------- | ----------------------------------------------------------------------------------------- |
| `super_admin` | Developer / owner. Full control, including platform keys. Can also use the student portal |
| `admin`       | Business owner. Day-to-day management, can create accounts in any role                    |
| `marketing`   | Meta ad tracking only                                                                     |
| `staff`       | Enrollment and student support                                                            |
| `mentor`      | Teaching, test building and marking                                                       |
| `student`     | Student portal                                                                            |

## Procedure tiers

`server/_core/trpc.ts`:

| Procedure             | Who passes                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `publicProcedure`     | Everyone                                                                                       |
| `protectedProcedure`  | Any signed-in user                                                                             |
| `adminProcedure`      | `super_admin`, `admin`, `staff`, `mentor` (`canAccessAdminDashboard`)                          |
| `marketingProcedure`  | `marketing`, `admin`, `super_admin`                                                            |
| `superAdminProcedure` | `super_admin` only                                                                             |
| `studentProcedure`    | `student` and `super_admin` app accounts (and the dev admin, through its auto-created account) |

Some procedures add finer checks inside the handler:

- **User management** (`users.list`, `update`, `resetPassword`) needs `admin` or `super_admin`. Only `super_admin` can manage, promote to, or reset the password of `admin` or `super_admin` accounts. Nobody can deactivate themselves or change their own role.
- **Own email:** only the Super Admin can change their own email (Admin → Profile, `auth.updateProfile`). Every other role sees it locked and must ask the Super Admin. Anyone can change their own name and photo.
- **Email changes** (`users.update` with `email`, rule `canChangeEmailOf`): the Super Admin can change any account's email, their own included. An Admin can change only Marketing, Staff, Mentor and Student emails. The new email must be unused. A student's enrollments move to the new email in the same transaction, so their batch and profile stay linked. Sessions are tied to the account ID, so the person stays signed in.
- **Account creation** (`users.create`): admins can create any role. `staff` can create `student` accounts only.
- **Student accounts** (`students.create`, `update`, `resetPassword`) use plain `adminProcedure`, so every dashboard role can use them, mentors included. They only ever act on rows whose role is `student`.
- **Online payment and gateway settings** (`paymentGateway.*`) need `admin` or `super_admin`.
- **AI marking key** (`aiSettings.*`) needs `super_admin`.
- **Meta tracking** (`metaSettings.*`) uses the marketing tier.

## What each role can actually do

| Capability                                                                                                     |     Super Admin     |               Admin               |     Staff     |                 Mentor                 | Marketing | Student |
| -------------------------------------------------------------------------------------------------------------- | :-----------------: | :-------------------------------: | :-----------: | :------------------------------------: | :-------: | :-----: |
| Admin dashboard (content, courses, batches, enrollments, IELTS builder and marking, resources, media, website) |          ✓          |                 ✓                 |       ✓       |                   ✓                    |     –     |    –    |
| List, edit and reset users                                                                                     |          ✓          |                 ✓                 |       –       |                   –                    |     –     |    –    |
| Create accounts                                                                                                |      any role       |             any role              | students only | students only (API, `students.create`) |     –     |    –    |
| Deactivate / reset password of **student** accounts (`students.*`)                                             |          ✓          |                 ✓                 |       ✓       |                   ✓                    |     –     |    –    |
| Change sign-in email                                                                                           | everyone, incl. own | Marketing, Staff, Mentor, Student |       –       |                   –                    |     –     |    –    |
| Manage admin / super admin accounts                                                                            |          ✓          |                 –                 |       –       |                   –                    |     –     |    –    |
| Online payment settings                                                                                        |          ✓          |                 ✓                 |       –       |                   –                    |     –     |    –    |
| Meta tracking settings                                                                                         |          ✓          |                 ✓                 |       –       |                   –                    |     ✓     |    –    |
| AI marking API key                                                                                             |          ✓          |                 –                 |       –       |                   –                    |     –     |    –    |
| Student portal                                                                                                 |          ✓          |                 –                 |       –       |                   –                    |     –     |    ✓    |

> **Note:** the per-role descriptions on the Roles page (for example, "Mentor: view assigned students") describe the _intended_ split between Staff and Mentor. The API does not enforce that split today: both roles pass `adminProcedure` and can use every admin-dashboard procedure except the user, payment, Meta and AI checks above. If those boundaries matter, add role checks to the relevant procedures.

## Admin portal UI by role

- `marketing` users who open `/admin` see only Settings (the **Marketing** and **Security** tabs) and their profile (`canAccessAdminPortal`).
- `staff` users get an **Add student or mentor** shortcut. They can create `student` and `mentor` accounts only (`creatableRoles` in `shared/roles.ts`, checked again on the server).
- `super_admin` sees a **Student dashboard** link and the **AI marking** settings tab. `admin` and `super_admin` see **Online payment** and **Marketing**.
