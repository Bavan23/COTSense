import { Header } from "../header";
import { ThemeProvider } from "@/lib/theme-provider";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  );
}
