import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  isLoading?: boolean;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "e.g., 5V regulator, 3A, < $2", 
  defaultValue = "",
  isLoading = false 
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 text-base"
          disabled={isLoading}
          data-testid="input-search"
        />
      </div>
      <Button 
        type="submit" 
        size="lg" 
        className="h-14 px-8"
        disabled={isLoading || !query.trim()}
        data-testid="button-search"
      >
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
