import type { Boom } from "@hapi/boom";
import { DisconnectReason, fetchLatestBaileysVersion, makeWASocket, type WASocket } from "baileys";
import cron, { type ScheduledTask } from "node-cron";
import pino from "pino";
import qrcode from "qrcode";
import { useSingleFileAuthState } from "./auth.js";

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
    message: `IT'S TIME FOR MAGRIB!
Get up and prepare.

*[Salah Bot]*`,
    schedule: "* * * * *"
  }
];

// ============= BOT IMPLEMENTATION =============
let sock: WASocket;
const scheduledTasks: ScheduledTask[] = [];

async function connectToWhatsApp() {
  const { state, saveCreds } = await useSingleFileAuthState("auth_state.json");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ transport: { target: "pino-pretty" } })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      // as an example, this prints the qr code to the terminal
      console.log(await qrcode.toString(qr, { type: "terminal", small: true }));
    }
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting ",
        shouldReconnect
      );
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("🚀 WhatsApp bot is ready!");
      onReady();
    }
  });
}

async function onReady() {
  console.log(`📅 Current time: ${new Date().toLocaleString()}`);
  console.log("\n--- Scheduled Messages ---");

  // Set up all scheduled messages
  for (const config of SCHEDULED_MESSAGES) {
    setupScheduledMessage(config);
  }

  console.log("\n✨ All schedules are active. Keep this process running.\n");
  console.log("Press Ctrl+C to stop the bot.\n");
}

// Find chat by phone number or group name
async function findChat(target: string, isGroup: boolean): Promise<string | null> {
  try {
    if (isGroup) {
      // Search for group by name
      const groups = await sock.groupFetchAllParticipating();
      for (const id in groups) {
        if (groups[id].subject.toLowerCase() === target.toLowerCase()) {
          return id;
        }
      }
      console.error(`❌ Group not found: ${target}`);
      return null;
    }
    // For contacts, format as WhatsApp ID
    // Remove any +, spaces, or dashes from phone number
    const cleanNumber = target.replace(/[\s\-+]/g, "");
    // Baileys uses @s.whatsapp.net for individual contacts
    return `${cleanNumber}@s.whatsapp.net`;
  } catch (error) {
    console.error(`❌ Error finding chat for ${target}:`, error);
    return null;
  }
}

// Send message to a chat
async function sendMessage(chatId: string, message: string): Promise<boolean> {
  try {
    await sock.sendMessage(chatId, { text: message });
    console.log(`✅ [${new Date().toLocaleString()}] Message sent successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send message:`, error);
    return false;
  }
}

// Set up a scheduled message
function setupScheduledMessage(config: ScheduledMessageConfig) {
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

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Shutting down gracefully...");
  // Stop all scheduled tasks
  for (const task of scheduledTasks) {
    task.stop();
  }
  process.exit(0);
});

// Start the client
console.log("🔄 Starting WhatsApp bot...");
connectToWhatsApp();
