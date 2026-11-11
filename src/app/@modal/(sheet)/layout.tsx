import Sheet from "@/components/Sheet";

// One sheet for every intercepted detail route, so stepping between records never re-animates it.
export default function SheetLayout({ children }: { children: React.ReactNode }) {
  return <Sheet>{children}</Sheet>;
}
