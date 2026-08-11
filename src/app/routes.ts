import { createBrowserRouter } from "react-router";
import { KFOLayout } from "./components/KFOLayout";
import { KFOHomePage } from "./components/pages/KFOHomePage";
import { ImpressumDatenschutzPage } from "./components/pages/ImpressumDatenschutzPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { AdminRouteFallback } from "./components/AdminRouteFallback";
import { RouteErrorPage } from "./components/RouteErrorPage";

export const router = createBrowserRouter([
  {
    path: "/verwaltung/*",
    HydrateFallback: AdminRouteFallback,
    ErrorBoundary: RouteErrorPage,
    lazy: async () => {
      const { AdminApp } = await import("./admin/AdminApp");
      return { Component: AdminApp };
    },
  },
  {
    path: "/",
    Component: KFOLayout,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, Component: KFOHomePage },
      { path: "impressum-datenschutz", Component: ImpressumDatenschutzPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
