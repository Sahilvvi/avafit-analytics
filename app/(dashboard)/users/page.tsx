import { redirect } from "next/navigation";

/** Renamed to /testers to match the rest of the dashboard's language. */
export default function UsersRedirect() {
  redirect("/testers");
}
