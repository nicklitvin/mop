import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from './routes/Layout'
import { Home } from './routes/Home'
import { MOPPage } from './routes/MOP';

export const router = createBrowserRouter([
    {
        errorElement: <></>,
        children: [
            {
                element: <Layout />,
                children: [
                    {
                        path: "/",
                        element: <Home />
                    },
                    {
                        path: "/mop",
                        element: <MOPPage />
                    }
                ]
            }
        ]
    }
])

createRoot(document.getElementById('root')!).render(
    <RouterProvider router={router} />
)
