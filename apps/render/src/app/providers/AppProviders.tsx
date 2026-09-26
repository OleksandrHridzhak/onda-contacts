import type { PropsWithChildren } from "react";
import { HashRouter } from "react-router-dom";

export function AppProviders({
  children,
}: PropsWithChildren): React.ReactElement {
  return <HashRouter>{children}</HashRouter>;
}
