import { useEffect, useState } from "react";
import { getSettings, saveSettings, type SendShortcutSettings, DEFAULT_SETTINGS } from "../storage";
import { cn } from "../utils";

interface ToggleSwitchProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch = ({ id, label, checked, onChange }: ToggleSwitchProps) => (
  <label htmlFor={id} className="flex items-center justify-between cursor-pointer py-2">
    <span className="text-sm text-zinc-200">{label}</span>
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={cn(
          "w-10 h-5 rounded-full transition-colors",
          "bg-zinc-600 peer-checked:bg-blue-500"
        )}
      />
      <div
        className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform",
          "bg-white peer-checked:translate-x-5"
        )}
      />
    </div>
  </label>
);

const App = () => {
  const [settings, setSettings] = useState<SendShortcutSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const handleChange = async (key: keyof SendShortcutSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  if (!loaded) {
    return (
      <div className="w-72 p-4 bg-zinc-800">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-72 p-4 bg-zinc-800">
      <h1 className="text-white font-semibold text-base mb-3">Vimini Settings</h1>

      <div className="border-t border-zinc-700 pt-3">
        <h2 className="text-zinc-400 text-xs uppercase tracking-wide mb-2">
          Send Shortcuts
        </h2>
        <div className="space-y-1">
          <ToggleSwitch
            id="ctrl-enter"
            label="Ctrl + Enter"
            checked={settings.ctrlEnter}
            onChange={(v) => handleChange("ctrlEnter", v)}
          />
          <ToggleSwitch
            id="shift-enter"
            label="Shift + Enter"
            checked={settings.shiftEnter}
            onChange={(v) => handleChange("shiftEnter", v)}
          />
        </div>
      </div>

      <p className="text-zinc-500 text-xs mt-4">
        Choose which shortcuts trigger message send.
      </p>
    </div>
  );
};

export default App;
