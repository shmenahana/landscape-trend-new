import Head from "next/head";
import Header from "./Header";
import Footer from "./Footer";
import { business } from "../lib/config";

export default function Layout({ children, title }) {
  return (
    <div className="flex min-h-screen flex-col bg-amber-50/40">
      <Head>
        <title>{title ? `${title} · ${business.name}` : business.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Seasoned firewood for sale in Akron, Ohio — sold by the cord and fraction of a cord."
        />
      </Head>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
