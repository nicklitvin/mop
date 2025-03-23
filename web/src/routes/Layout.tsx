import { Outlet } from "react-router";

export function Layout() {
    return (
        <div className="min-h-screen flex">
            <Outlet />
        </div>
    )
}