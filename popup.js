import { AuthService } from "./core/service/auth.service.js";
import { VaultService } from "./core/service/vault.service.js";
import { Bytes } from "./core/utils/bytes.js";
import { SecureLink } from "./core/service/secure-link.js";
import { LocalStorage } from "./core/utils/local.js";

document.addEventListener("DOMContentLoaded", async () => {
    const info = document.querySelector('#signin-info');
    info.innerHTML = 'Avvio in corso dell\'estensione...';
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
                // accesso classico
                // e.preventDefault();
                // // ---
                // const email = document.getElementById("email").value;
                // const password = document.getElementById("password").value;
                // // ---
                // if (await AuthService.signin(email, password)) {
                //     e.target.reset();
                //     PopupUI.init(false);
                //     VaultService.init();
                // }
                /**
                 * Accesso tramite token
                 */
                e.preventDefault();
                const token = document.getElementById("token").value;
                const [id, key] = new TextDecoder().decode(Bytes.base32.decode(token)).split(".");
                try {
                    const [email, password] = await SecureLink.get("ext-signin", id, key);
                    if (await AuthService.signin(email, password)) {
                        e.target.reset();
                        PopupUI.init(false);
                        VaultService.init();
                    }
                } catch (error) {
                    alert("Errore durante l'accesso, verifica l'errore nelle informazioni");
                    info.textContent = error;
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
    const vaultInfo = document.getElementById('vault-info');
    document.getElementById('logout-btn').addEventListener('click', async () => {
        if (!confirm('Signout?')) return;
        await AuthService.signout();
        PopupUI.init(true);
    });
    /**
     * SMART SYNC
     */
    document.getElementById('smartsync-btn').addEventListener('click', async () => {
        vaultInfo.innerHTML = "Downloading latest data from your vault...";
        if (await VaultService.syncronize(false)) {
            setTimeout(() => {
                vaultInfo.innerHTML = "Vault is up to date";
            }, 2000);
        } else {
            vaultInfo.innerHTML = "Something went wrong, try 'full sync' instead";
        }
    });
    /**
     * FULL SYNC
     */
    document.getElementById('fullsync-btn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to fully synchronize with the server?')) return;
        vaultInfo.innerHTML = "Downloading all data from your vault...";
        if (await VaultService.syncronize(true)) {
            setTimeout(() => {
                vaultInfo.innerHTML = "Vault is up to date";
            }, 2000);
        } else {
            vaultInfo.innerHTML = "Something went wrong, you may need to log in again";
        }
    });
});

class PopupUI {
    static activeDisplay = "";
    static async init(logout = false) {
        document.querySelector("#signin").style.display = logout ? '' : "none";
        document.querySelector("#app").style.display = logout ? 'none' : "";
        const email = await LocalStorage.get("email");
        if (!email) return;
        document.querySelector("#user-email").textContent = email.split("@")[0];
    }
}
