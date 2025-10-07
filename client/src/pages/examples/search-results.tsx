import SearchResults from "../search-results";
import { ThemeProvider } from "@/lib/theme-provider";

export default function SearchResultsExample() {
  return (
    <ThemeProvider>
      <SearchResults />
    </ThemeProvider>
  );
}
