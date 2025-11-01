// app/api/auth/register-phone/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { phone, organizationId } = await request.json();

    // Делаем запрос к ZITADEL API через сервер (без CSP ограничений)
    const response = await fetch("http://localhost:8080/v2/users/register/phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        organization_id: organizationId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Registration API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
