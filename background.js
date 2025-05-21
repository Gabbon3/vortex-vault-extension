import { AuthService } from "./core/service/auth.service.js";
import { SessionStorage } from "./core/utils/session.js";

/**
 * Handler di messaggi in ricezione
 */
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "vault-login") {
        if (await AuthService.signin(message.payload.email, message.payload.password)) {
            console.log('Accesso effettuato');
            console.log(SessionStorage.memory);
        }
    }
});