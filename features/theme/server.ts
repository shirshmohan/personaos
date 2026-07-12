import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, isTheme, type ThemeId } from "./themes";

export async function getTheme(): Promise<ThemeId> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}
