import { CommercialSiteFooter, CommercialSiteHeader } from "./commercial-site-shell";

type Section = {
  title: string;
  body: string[];
};

export function CommercialLegalPage({
  eyebrow,
  title,
  introduction,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  updated: string;
  sections: Section[];
}) {
  return (
    <main id="main-content" className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />
      <section className="border-b border-[#d7dfdb] bg-white px-5 py-14 sm:px-7 sm:py-20 lg:px-10">
        <div className="mx-auto w-full max-w-[72rem]">
          <p className="text-sm font-bold uppercase text-[#007c89]">{eyebrow}</p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-[#53635f]">{introduction}</p>
          <p className="mt-5 text-xs font-bold uppercase text-[#65766f]">Last updated {updated}</p>
        </div>
      </section>
      <section className="px-5 py-12 sm:px-7 sm:py-16 lg:px-10">
        <div className="mx-auto w-full max-w-[72rem] border-t border-[#bdcbc5]">
          {sections.map((section) => (
            <article key={section.title} className="grid gap-4 border-b border-[#bdcbc5] py-7 md:grid-cols-[0.38fr_0.62fr] md:gap-12">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="grid gap-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-base font-medium leading-7 text-[#4f625c]">{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <CommercialSiteFooter />
    </main>
  );
}
