import { AuthService } from "./core/service/auth.service.js";
import { VaultService } from "./core/service/vault.service.js";
import { LocalStorage } from "./core/utils/local.js";

document.addEventListener("DOMContentLoaded", async () => {
    const info = document.querySelector('#signin-info');
    info.innerHTML = 'SHIV is starting...';
    const sessionInitialized = await AuthService.init();
    if (sessionInitialized) {
        PopupUI.init(false);
        VaultService.init();
    } else {
        info.innerHTML = 'Sign-in is needed';
        /**
         * LOGIN
         */
        document
            .querySelector("#signin")
            .addEventListener("submit", async (e) => {
                e.preventDefault();
                // ---
                const email = document.getElementById("email").value;
                const password = document.getElementById("password").value;
                // ---
                if (await AuthService.signin(email, password)) {
                    e.target.reset();
                    PopupUI.init(false);
                    VaultService.init();
                }
            });
    }
    /**
     * UNLOCK VAULT
     */
    // document.getElementById('unlock-vault').addEventListener('click', async () => {
    //     const started = await AuthService.startSession();
    //     console.log(started);
    // })
    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (!confirm('Signout?')) return;
        await AuthService.signout();
        PopupUI.init(true);
    })
});

class PopupUI {
    static activeDisplay = "";
    static async init(logout = false) {
        document.querySelector("#signin").style.display = logout ? '' : "none";
        document.querySelector("#app").style.display = logout ? 'none' : "";
        const email = await LocalStorage.get("email-utente");
        if (!email) return;
        document.querySelector("#user-email").textContent = email.split("@")[0];
    }
}
