import cron, { type ScheduledTask } from "node-cron";
import qrcode from "qrcode-terminal";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth } = pkg;

type ScheduledMessageConfig = {
  target: string;
  isGroup: boolean;
  message: string;
  schedule: string;
};

// ============= CONFIGURATION =============
// Add your scheduled messages here
const SCHEDULED_MESSAGES: ScheduledMessageConfig[] = [
  {
    target: "Test",
    isGroup: true,
    message: "🕌 Zuhr Reminder\n\nIt's time for Zuhr prayer. May Allah accept your prayers. 🤲",
    schedule: "10 13 * * 0-4,6" // 1:10 PM, Saturday-Thursday
  },
  {
    target: "Test",
    isGroup: true,
    message: "🕌 Asr Reminder\n\nIt's time for Asr prayer. May Allah accept your prayers. 🤲",
    schedule: "55 15 * * 0-4,6" // 3:55 PM, Saturday-Thursday
  },
  {
    target: "Test",
    isGroup: true,
    message:
      "🕌 Maghrib Reminder\n\nIt's time for Maghrib prayer. May Allah accept your prayers. 🤲",
    schedule: "20 17 * * 0-4,6" // 5:20 PM, Saturday-Thursday
  }
];

// ============= BOT IMPLEMENTATION =============
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth" // Stores session data locally
  }),
  puppeteer: {
    headless: true, // Set to false to see the browser
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu"
    ]
  }
});

// Store scheduled tasks to manage them
const scheduledTasks: ScheduledTask[] = [];

// Display QR code for authentication
client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp to login:\n");
  qrcode.generate(qr, { small: true });
  console.log("\nWaiting for authentication...\n");
});

// Handle authentication
client.on("authenticated", () => {
  console.log("✅ Authentication successful!");
});

// Handle authentication failure
client.on("auth_failure", (msg) => {
  console.error("❌ Authentication failed:", msg);
  process.exit(1);
});

// When client is ready
client.on("ready", async () => {
  console.log("🚀 WhatsApp bot is ready!");
  console.log(`📅 Current time: ${new Date().toLocaleString()}`);
  console.log("\n--- Scheduled Messages ---");
  console.log("\n-------------------------\n");

  // Set up all scheduled messages
  for (const config of SCHEDULED_MESSAGES) {
    await setupScheduledMessage(config);
  }

  console.log("\n✨ All schedules are active. Keep this process running.\n");
  console.log("Press Ctrl+C to stop the bot.\n");
});

// Find chat by phone number or group name
async function findChat(target: string, isGroup: boolean): Promise<string | null> {
  try {
    if (isGroup) {
      // Search for group by name
      const chats = await client.getChats();
      const group = chats.find(
        (chat) => chat.isGroup && chat.name.toLowerCase() === target.toLowerCase()
      );
      if (group) {
        return group.id._serialized;
      }
      console.error(`❌ Group not found: ${target}`);
      return null;
    }
    // For contacts, format as WhatsApp ID
    // Remove any +, spaces, or dashes from phone number
    const cleanNumber = target.replace(/[\s\-+]/g, "");
    const chatId = `${cleanNumber}@c.us`;
    return chatId;
  } catch (error) {
    console.error(`❌ Error finding chat for ${target}:`, error);
    return null;
  }
}

// Send message to a chat
async function sendMessage(chatId: string, message: string): Promise<boolean> {
  try {
    await client.sendMessage(chatId, message);
    console.log(`✅ [${new Date().toLocaleString()}] Message sent successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send message:`, error);
    return false;
  }
}

// Set up a scheduled message
async function setupScheduledMessage(config: {
  target: string;
  isGroup: boolean;
  message: string;
  schedule: string;
}) {
  const { target, isGroup, message, schedule } = config;

  // Validate cron expression
  if (!cron.validate(schedule)) {
    console.error(`❌ Invalid cron schedule: ${schedule}`);
    return;
  }

  console.log(`📌 Scheduling message to ${isGroup ? "group" : "contact"}: ${target}`);
  console.log(`   Schedule: ${schedule}`);
  console.log(`   Message: "${message.substring(0, 50)}${message.length > 50 ? "..." : ""}"`);

  // Schedule the task
  const task = cron.schedule(
    schedule,
    async () => {
      console.log(`\n⏰ [${new Date().toLocaleString()}] Triggering scheduled message...`);

      const chatId = await findChat(target, isGroup);
      if (chatId) {
        await sendMessage(chatId, message);
      }
    },
    {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use system timezone
    }
  );

  scheduledTasks.push(task);
}

// Handle disconnection
client.on("disconnected", (reason) => {
  console.log("❌ Client disconnected:", reason);
  // Stop all scheduled tasks
  for (const task of scheduledTasks) {
    task.stop();
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Shutting down gracefully...");
  // Stop all scheduled tasks
  for (const task of scheduledTasks) {
    task.stop();
  }
  await client.destroy();
  console.log("👋 Goodbye!");
  process.exit(0);
});

// Start the client
console.log("🔄 Starting WhatsApp bot...");
console.log("This may take a moment on first run...\n");
client.initialize();
