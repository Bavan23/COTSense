import About from "../about";
import { ThemeProvider } from "@/lib/theme-provider";

export default function AboutExample() {
  return (
    <ThemeProvider>
      <About />
    </ThemeProvider>
  );
}
