import { Sidebar } from "app/layouts/Sidebar/Sidebar";
import { WindowTitleBar } from "app/layouts/WindowTitleBar/WindowTitleBar";
import { AppRouter } from "app/router/AppRouter";
import { useNextRouteShortcut } from "app/router/useNextRouteShortcut";

export function AppLayout(): React.ReactElement {
  const isElectron = Boolean(globalThis.electronAPI);

  useNextRouteShortcut();

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          {isElectron && <WindowTitleBar />}
          <div className="min-h-0 flex-1">
            <AppRouter />
          </div>
        </main>
      </div>
    </div>
  );
}
