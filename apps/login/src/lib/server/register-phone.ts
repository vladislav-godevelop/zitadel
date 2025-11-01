export const registerPhone = async (phone: string, organizationId: string) => {
  try {
    const response = await fetch("/ui/v2/login/api/auth/register-phone", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        organizationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    const data = await response.json();
    return data.user_id;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};
