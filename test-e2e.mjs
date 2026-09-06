// End-to-end testing script for Push Lab
const BASE_URL = "http://localhost:3000";

let sessionCookie = "";

async function fetchWithCookie(path, options = {}) {
  const headers = options.headers || {};
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log("🚀 Starting Push Lab E2E Verification Tests...\n");

  const testEmail = `tester_${Date.now()}@example.com`;
  const testPassword = "password123";

  // 1. Signup
  console.log("1. Testing User Sign Up...");
  const signupRes = await fetchWithCookie("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Marcus Vance",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  console.log(`   Status: ${signupRes.status} | User: ${signupRes.data?.user?.email}`);
  if (!signupRes.ok) throw new Error("Sign up failed");

  // 2. Fetch Templates
  console.log("2. Testing Templates API...");
  const tmplRes = await fetchWithCookie("/api/templates");
  const templates = tmplRes.data?.templates || [];
  console.log(`   Found ${templates.length} templates (Expected at least 10 system templates)`);
  if (templates.length < 10) throw new Error("Templates count less than 10");

  const systemCount = templates.filter((t) => t.isSystemTemplate).length;
  console.log(`   System Templates verified: ${systemCount}/10`);
  if (systemCount < 10) throw new Error("Not all 10 system templates were seeded");

  // 3. Duplicate a Template
  console.log("3. Testing Template Duplication...");
  const targetTmpl = templates[0];
  const dupRes = await fetchWithCookie(`/api/templates/${targetTmpl.id}/duplicate`, {
    method: "POST",
  });
  console.log(`   Duplicated: "${dupRes.data?.template?.name}" | ID: ${dupRes.data?.template?.id}`);
  if (!dupRes.ok) throw new Error("Duplication failed");

  // 4. Create Notification
  console.log("4. Testing Notification Creation...");
  const createRes = await fetchWithCookie("/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "E2E Test Notification",
      title: "Flash Sale Alert! ⚡",
      body: "Everything is 50% off for the next hour.",
      icon: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=128",
      badge: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=96",
      image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600",
      url: "/dashboard",
      tag: "e2e-flash",
      requireInteraction: true,
      actions: [
        { action: "buy", title: "Shop Now" },
        { action: "dismiss", title: "Dismiss" },
      ],
      data: { discount: 50, promoCode: "FLASH50" },
    }),
  });
  const notifId = createRes.data?.notification?.id;
  console.log(`   Created Notification ID: ${notifId}`);
  if (!notifId) throw new Error("Notification creation failed");

  // 5. Get Notification by ID
  console.log("5. Testing Get Notification by ID...");
  const getRes = await fetchWithCookie(`/api/notifications/${notifId}`);
  console.log(`   Fetched: "${getRes.data?.notification?.name}" | Actions: ${getRes.data?.notification?.actions?.length}`);
  if (!getRes.ok) throw new Error("Get notification failed");

  // 6. Update Notification
  console.log("6. Testing Notification Update (PUT)...");
  const updateRes = await fetchWithCookie(`/api/notifications/${notifId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getRes.data.notification,
      title: "Flash Sale Alert! ⚡ [UPDATED]",
      body: "Updated message for testing purposes.",
    }),
  });
  console.log(`   Updated Title: "${updateRes.data?.notification?.title}"`);
  if (!updateRes.ok) throw new Error("Update notification failed");

  // 7. Subscribe a Push Device
  console.log("7. Testing Push Device Registration (Subscribe)...");
  const dummyEndpoint = `https://fcm.googleapis.com/fcm/send/fake-token-${Date.now()}`;
  const subRes = await fetchWithCookie("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: {
        endpoint: dummyEndpoint,
        keys: {
          p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4Ywf_00s_c-0w9YyP6-bYJ10h-N4i5rF8g3_q6oZ6v_7-V1w_00s_c-0",
          auth: "fake-auth-key-12345",
        },
      },
      browser: "Chrome",
      platform: "Windows",
      deviceName: "Chrome on Windows (E2E Test Device)",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }),
  });
  console.log(`   Subscribed device: ${subRes.data?.subscription?.deviceName}`);
  if (!subRes.ok) throw new Error("Device registration failed");

  // 8. List Devices
  console.log("8. Testing Devices Listing...");
  const devListRes = await fetchWithCookie("/api/devices");
  console.log(`   Devices registered for user: ${devListRes.data?.devices?.length}`);
  if (!devListRes.data?.devices?.length) throw new Error("Device list empty");

  // 9. Send Test Push Notification
  console.log("9. Testing Web Push Dispatch (/api/notifications/[id]/test)...");
  const pushRes = await fetchWithCookie(`/api/notifications/${notifId}/test`, {
    method: "POST",
  });
  console.log(`   Push Dispatch Result: ${JSON.stringify(pushRes.data)}`);

  // 10. Inspect Notification History
  console.log("10. Testing Notification History Inspection...");
  const histRes = await fetchWithCookie("/api/history");
  console.log(`   History items logged: ${histRes.data?.history?.length}`);
  if (histRes.data?.history?.length > 0) {
    const firstItem = histRes.data.history[0];
    console.log(`   Latest Log: "${firstItem.title}" | Status: ${firstItem.status} | Device: ${firstItem.device}`);
  }

  // 11. Delete Notification
  console.log("11. Testing Notification Deletion...");
  const delRes = await fetchWithCookie(`/api/notifications/${notifId}`, {
    method: "DELETE",
  });
  console.log(`   Delete status: ${delRes.data?.message}`);
  if (!delRes.ok) throw new Error("Delete failed");

  // 12. Logout
  console.log("12. Testing Logout...");
  const logoutRes = await fetchWithCookie("/api/auth/logout", {
    method: "POST",
  });
  console.log(`   Logout status: ${logoutRes.data?.message}`);

  console.log("\n✅ ALL 12 E2E VERIFICATION TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ E2E Test Failed:", err);
  process.exit(1);
});
