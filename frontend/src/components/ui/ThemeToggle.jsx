import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../hooks/useRedux";
import { toggleTheme } from "../../features/theme/themeSlice";

const ThemeToggle = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.theme.mode);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      title={
        themeMode === "dark"
          ? t("common.lightMode", "Mode Clair")
          : t("common.darkMode", "Mode Sombre")
      }
      className="p-2 text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors shrink-0"
    >
      {themeMode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeToggle;
