import { create } from "@zitadel/client";
import { createSessionAndUpdateCookie } from "./cookie";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";

export const startPhoneLogin = async (phone: string) => {
  try {
    const response = await fetch("/ui/v2/login/api/auth/login-phone/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login start failed");
    }

    const data = await response.json();
    return {
      userId: data.user_id,
      message: data.message,
    };
  } catch (error) {
    console.error("Login start error:", error);
    throw error;
  }
};
export const verifyPhoneLogin = async (userId: string, verificationCode: string, requestId?: string) => {
  try {
    const response = await fetch("/ui/v2/login/api/auth/login-phone/verify", {
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
      throw new Error(errorData.error || "Login verification failed");
    }

    const data = await response.json();

    if (data.success) {
      // Создаем сессию как в ZITADEL
      const checks = create(ChecksSchema, {
        user: { search: { case: "userId", value: data.user_id } },
      });

      const session = await createSessionAndUpdateCookie({
        checks,
        requestId: requestId || undefined,
      });

      // Редирект в ZITADEL Console после создания сессии
      window.location.href = "http://localhost:8080/ui/console";

      return {
        success: true,
        session,
        sessionId: data.session_id,
        sessionToken: data.session_token,
        userId: data.user_id,
      };
    }

    return {
      success: false,
      sessionId: data.session_id,
      sessionToken: data.session_token,
      userId: data.user_id,
    };
  } catch (error) {
    console.error("Login verification error:", error);
    throw error;
  }
};
