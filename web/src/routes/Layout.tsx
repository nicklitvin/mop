import { Outlet } from "react-router";
import { Toaster } from "sonner";

export function Layout() {
    return (
        <div className="min-h-screen flex max-w-screen-lg mx-auto">
            <Outlet />
            <Toaster />
        </div>
    )
}