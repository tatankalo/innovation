import Landscape from "@/components/landscape/Landscape";

export const metadata = {
  title: "Landscape · Unshelved",
  description: "Where NSF invests, where patents land and what each university is building.",
};

export default function LandscapePage() {
  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-8 pt-12">
      <p className="label mb-4">Landscape</p>
      <h1 className="font-serif text-[40px] leading-[44px] sm:text-[60px] sm:leading-[62px] tracking-[-0.02em] max-w-[900px]">
        Where the money goes. <em className="text-ink-2">Where the patents land.</em>
      </h1>
      <p className="mt-5 text-[18px] leading-8 text-ink-2 max-w-[640px]">
        Every NSF award and university patent since 2021, sorted into eight technology sectors. Pick a sector to
        see who leads it.
      </p>
      <Landscape />
    </div>
  );
}
