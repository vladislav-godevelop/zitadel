import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    const zitadelApiUrl = process.env.ZITADEL_API_URL || "http://localhost:8080";

    const response = await fetch(`${zitadelApiUrl}/v2/users/login/phone/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Login start API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
