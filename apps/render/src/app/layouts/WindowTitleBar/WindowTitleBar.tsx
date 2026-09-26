import React from "react";
import { Minus, Square, X } from "lucide-react";
import { useThemeStore } from "features/settings/stores/useThemeStore";

export const WindowTitleBar = () => {
  const themeMode = useThemeStore((state) => state.themeMode);

  const getButtonClass = (): string => {
    const base =
      "w-8 h-8 flex items-center justify-center rounded no-drag transition-colors duration-200";
    return themeMode === "dark"
      ? `${base} text-textMuted hover:bg-secondary hover:text-text`
      : `${base} text-textMuted hover:bg-secondary`;
  };

  return (
    <div
      className={`drag flex w-full items-center justify-end gap-1 px-2 py-1 bg-surface`}
    >
      <button
        onClick={() => globalThis.electronAPI?.minimizeWindow()}
        className={getButtonClass()}
        aria-label="Minimize window"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={() => globalThis.electronAPI?.maximizeWindow()}
        className={getButtonClass()}
        aria-label="Maximize window"
      >
        <Square size={16} />
      </button>
      <button
        onClick={() => globalThis.electronAPI?.closeWindow()}
        className={getButtonClass()}
        aria-label="Close window"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default WindowTitleBar;
