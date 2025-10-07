import Admin from "../admin";
import { ThemeProvider } from "@/lib/theme-provider";

export default function AdminExample() {
  return (
    <ThemeProvider>
      <Admin />
    </ThemeProvider>
  );
}
