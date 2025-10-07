import { SearchBar } from "../search-bar";

export default function SearchBarExample() {
  return (
    <div className="w-full max-w-4xl p-8">
      <SearchBar 
        onSearch={(query) => console.log("Search:", query)} 
        placeholder="Search for components..."
      />
    </div>
  );
}
