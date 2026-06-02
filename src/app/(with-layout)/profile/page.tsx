import { redirect } from "next/navigation";

// Profile is now role-split: admins → /admin, providers → /portal/profile
export default function ProfilePage() {
  redirect("/portal/profile");
}
