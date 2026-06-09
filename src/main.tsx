import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { Providers } from "@/app/providers"
import { routeTree } from "./routeTree.gen"
// i18n must be imported before ReactDOM.createRoot to ensure strings are
// available synchronously on first render (NFR-02: no FOUC).
import "@/lib/i18n"
import "./index.css"

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Root element not found")

createRoot(rootEl).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
