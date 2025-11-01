import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { phone, organizationId } = await request.json();

    const zitadelApiUrl = "http://localhost:8080";

    const response = await fetch(`${zitadelApiUrl}/v2/users/register/phone`, {
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
export const verifyPhoneCode = async (userId: string, verificationCode: string) => {
  try {
    const response = await fetch("/ui/v2/login/api/auth/verify-phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        verificationCode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Verification failed");
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Verification error:", error);
    throw error;
  }
};
