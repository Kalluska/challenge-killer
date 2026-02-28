import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey || typeof licenseKey !== "string") {
      return NextResponse.json({ ok: false, error: "Missing license key" }, { status: 400 });
    }

    const productPermalink = process.env.GUMROAD_PRODUCT_PERMALINK;
    if (!productPermalink) {
      return NextResponse.json({ ok: false, error: "Server not configured" }, { status: 500 });
    }

    const url = new URL("https://api.gumroad.com/v2/licenses/verify");
    url.searchParams.set("product_permalink", productPermalink);
    url.searchParams.set("license_key", licenseKey.trim());

    const resp = await fetch(url.toString(), { method: "GET" });
    const data = await resp.json();

    if (!data.success) {
      return NextResponse.json({ ok: false, error: "Invalid key" }, { status: 200 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 500 });
  }
}
