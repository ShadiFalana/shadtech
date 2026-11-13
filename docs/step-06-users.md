# الخطوة 6 — إدارة المستخدمين

## الهدف

إدارة **أعضاء المؤسسة**: إضافة مستخدمين (أو ربط مستخدمين موجودين)، تغيير أدوارهم،
إعادة تعيين كلمات مرورهم، وإزالتهم. كل ذلك داخل `tenant_id` ومع صلاحيات `members.*`.

## endpoints

| المسار                               | الطريقة | الصلاحية         |
| ------------------------------------ | ------- | ---------------- |
| `/api/v1/roles`                      | GET     | `members.read`   |
| `/api/v1/members`                    | GET     | `members.read`   |
| `/api/v1/members`                    | POST    | `members.manage` |
| `/api/v1/members/:id/role`           | PATCH   | `members.manage` |
| `/api/v1/members/:id`                | DELETE  | `members.manage` |
| `/api/v1/members/:id/reset-password` | POST    | `members.manage` |

- إضافة عضو: if email exists → attach membership; else create user with temp password.
- duplicate membership → 409.
- لا يمكن تغيير دورك أو إزالة نفسك.
- لا يمكن إزالة آخر مالك للمؤسسة.
- reset password: @HttpCode 200.

## الواجهة

- `components/MembersPanel.tsx`: قائمة الأعضاء، إضافة، تغيير دور، إعادة تعيين كلمة مرور، إزالة.
- `DashboardPage`: لوحة "المستخدمون".

## التحقق

- API: add/list/update-role/reset-password/remove + 409 duplicate + 403 for viewer.
- UI: add member, change role, reset password, remove; no console errors.

## الخطوات التالية

- Step 7: customers.
- Step 8: audit log.
