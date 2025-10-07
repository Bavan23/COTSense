import ComponentDetails from "../component-details";
import { ThemeProvider } from "@/lib/theme-provider";

export default function ComponentDetailsExample() {
  return (
    <ThemeProvider>
      <ComponentDetails />
    </ThemeProvider>
  );
}
