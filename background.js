import { AuthService } from "./core/service/auth.service.js";

/**
 * Handler di messaggi in ricezione
 */
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "vault-login") {
        await AuthService.signin(message.payload.email, message.payload.password)
        
    }
});