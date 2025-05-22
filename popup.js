import { AuthService } from "./core/service/auth.service.js";
import { LocalStorage } from "./core/utils/local.js";

document.addEventListener('DOMContentLoaded', async () => {
    if (AuthService.init()) {
        document.querySelector('#signin').style.display = 'none';
        document.querySelector('#app').style.display = '';
        document.querySelector('#user-email').textContent = (await LocalStorage.get('email-utente')).split('@')[0];
        // ---
    } else {
        /**
         * LOGIN
         */
        document.querySelector('#signin').addEventListener('submit', async (e) => {
            e.preventDefault();
            // ---
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            // ---
            if (await AuthService.signin(email, password)) {
                alert('Accesso effettuato');
            }
        });
    }
    /**
     * UNLOCK VAULT
     */
    document.getElementById('unlock-vault').addEventListener('click', async () => {
        const started = await AuthService.startSession();
        console.log(started);
    })
});