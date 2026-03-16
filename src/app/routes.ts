import { createBrowserRouter } from "react-router";
import { KFOLayout } from "./components/KFOLayout";
import { KFOHomePage } from "./components/pages/KFOHomePage";
import { ImpressumDatenschutzPage } from "./components/pages/ImpressumDatenschutzPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: KFOLayout,
    children: [
      { index: true, Component: KFOHomePage },
      { path: "impressum-datenschutz", Component: ImpressumDatenschutzPage },
      { path: "*", Component: KFOHomePage },
    ],
  },
]);
