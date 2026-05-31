export default function Loading() {
  return (
    <main className="min-h-screen bg-[#edf1ee] px-4 py-6 text-[#13211f] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-5 xl:pl-72">
        <div className="h-10 w-52 animate-pulse rounded-md bg-[#d9e2dc]" />
        <div className="h-28 animate-pulse rounded-md border border-[#d9e2dc] bg-[#fbfaf6]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-md border border-[#d9e2dc] bg-[#fbfaf6]" />
          <div className="h-28 animate-pulse rounded-md border border-[#d9e2dc] bg-[#fbfaf6]" />
          <div className="h-28 animate-pulse rounded-md border border-[#d9e2dc] bg-[#fbfaf6]" />
        </div>
        <div className="h-72 animate-pulse rounded-md border border-[#d9e2dc] bg-[#fbfaf6]" />
      </div>
    </main>
  );
}
