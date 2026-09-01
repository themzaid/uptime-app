import { sendIncidentEmail } from "./src/worker/alerts";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.production" });
async function run() {
    console.log("Testing email sending...");
    await sendIncidentEmail("user_3IDOZs6bLykiAL5jhNFqcC0aAra", "Test Monitor", "https://example.com", "open");
    console.log("Done.");
}
run();
