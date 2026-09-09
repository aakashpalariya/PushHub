// End-to-end testing script for Push Lab & Multi-Device Scheduling
const BASE_URL = "http://localhost:3000";

let sessionCookie = "";

async function fetchWithCookie(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (sessionCookie) {
    headers["Cookie"] = sessionCookie;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/pushhub_[a-zA-Z0-9_-]+=[^;]+/);
    if (match) {
      sessionCookie = match[0];
    }
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
  console.log("🚀 Starting Push Hub E2E Verification & Feature Tests...\n");

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

  // 2. Register Device 1, 2, 3 (Multi-Device Support)
  console.log("2. Testing Multi-Device Subscriptions (Devices 1, 2, 3)...");
  for (let i = 1; i <= 3; i++) {
    const subRes = await fetchWithCookie("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: `https://fcm.googleapis.com/fcm/send/token-dev-${i}-${Date.now()}`,
          keys: { p256dh: `fake-p256dh-key-${i}`, auth: `fake-auth-key-${i}` },
        },
        browser: i === 1 ? "Chrome" : i === 2 ? "Safari" : "Firefox",
        platform: i === 1 ? "Windows" : i === 2 ? "iOS" : "Android",
        deviceName: `Device #${i}`,
        deviceId: `dev_id_${i}_${Date.now()}`,
      }),
    });
    if (!subRes.ok) {
      console.error(`   Failed device #${i} details:`, subRes.status, subRes.data);
      throw new Error(`Device #${i} registration failed`);
    }
    console.log(`   Device #${i} registered successfully`);
  }

  // 3. Attempt 4th Device (Enforcing 3-Device Maximum Limit)
  console.log("3. Testing 3-Device Maximum Limit Enforcement...");
  const sub4Res = await fetchWithCookie("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: {
        endpoint: `https://fcm.googleapis.com/fcm/send/token-dev-4-${Date.now()}`,
        keys: { p256dh: "fake-p256dh-4", auth: "fake-auth-4" },
      },
      browser: "Edge",
      platform: "macOS",
      deviceName: "Excess Device #4",
      deviceId: `dev_id_4_${Date.now()}`,
    }),
  });
  console.log(`   4th Device Response Status: ${sub4Res.status} | LimitReached: ${sub4Res.data?.limitReached}`);
  if (sub4Res.status !== 400 || !sub4Res.data?.limitReached) {
    throw new Error("3-device limit enforcement failed (4th device was not blocked)");
  }

  // 4. Presence Heartbeat
  console.log("4. Testing Device Heartbeat Presence Signal...");
  const devListBefore = await fetchWithCookie("/api/devices");
  const registeredDevices = devListBefore.data?.devices || [];
  console.log(`   Registered devices count: ${registeredDevices.length} / 3`);

  const hbRes = await fetchWithCookie("/api/push/heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceId: registeredDevices[0]?.deviceId,
      status: "active",
    }),
  });
  console.log(`   Heartbeat Status: ${hbRes.status} | Success: ${hbRes.data?.success}`);
  if (!hbRes.ok) throw new Error("Heartbeat API failed");

  // 5. Remote Device Disconnect
  console.log("5. Testing Remote Device Disconnection...");
  const targetToDisconnect = registeredDevices[2]; // Device #3
  const discRes = await fetchWithCookie(`/api/devices/${targetToDisconnect.id}`, {
    method: "DELETE",
  });
  console.log(`   Remote Disconnect Status: ${discRes.status} | Msg: ${discRes.data?.message}`);
  if (!discRes.ok) throw new Error("Remote device disconnect failed");

  // Verify device count is now 2
  const devListAfter = await fetchWithCookie("/api/devices");
  console.log(`   Devices remaining after remote disconnect: ${devListAfter.data?.devices?.length} / 3`);
  if (devListAfter.data?.devices?.length !== 2) throw new Error("Device count mismatch after disconnect");

  // 6. Test In-App Notification Scheduling (3s delay)
  console.log("6. Testing Notification Scheduling API (3s delay)...");
  const schedRes = await fetchWithCookie("/api/push/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Scheduled Test Push",
      body: "Delivering after 3 seconds in-app delay engine test.",
      delaySeconds: 3,
      targetMode: "all",
    }),
  });
  console.log(`   Scheduled item created: ID ${schedRes.data?.scheduledItem?.id} | Delay: ${schedRes.data?.scheduledItem?.delaySeconds}s`);
  if (!schedRes.ok) throw new Error("Schedule notification creation failed");

  const schedId = schedRes.data?.scheduledItem?.id;

  // 7. Verify Scheduled Queue Listing
  console.log("7. Testing Scheduled Queue Listing...");
  const listSchedRes = await fetchWithCookie("/api/push/schedule");
  const pendingCount = listSchedRes.data?.scheduled?.filter((s) => s.status === "pending").length;
  console.log(`   Pending scheduled items in queue: ${pendingCount}`);

  // 8. Wait 4 seconds for scheduler background engine to execute
  console.log("8. Waiting 4 seconds for background scheduler execution...");
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // Check updated schedule item status
  const listSchedAfter = await fetchWithCookie("/api/push/schedule");
  const targetItem = listSchedAfter.data?.scheduled?.find((s) => s.id === schedId);
  console.log(`   Scheduled item status after 4s: "${targetItem?.status}" | SentAt: ${targetItem?.sentAt}`);

  if (targetItem?.status !== "sent" && targetItem?.status !== "failed") {
    throw new Error(`Scheduler background engine failed to process item (Status: ${targetItem?.status})`);
  }

  // 9. Logout
  console.log("9. Testing Logout...");
  const logoutRes = await fetchWithCookie("/api/auth/logout", {
    method: "POST",
  });
  console.log(`   Logout status: ${logoutRes.data?.message}`);

  console.log("\n✅ ALL E2E MULTI-DEVICE & SCHEDULING VERIFICATION TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ E2E Test Failed:", err);
  process.exit(1);
});
