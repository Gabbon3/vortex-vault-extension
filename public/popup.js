import './secure/rust.init.js';
import { AuthService } from './service/auth.service.js';
import { Form } from "./utils/form.js";

document.addEventListener('DOMContentLoaded', async () => {
    Form.init();
    await AuthService.init();
    /**
     * SIGN-IN
     */
    Form.register('signin', async (form, elements) => {
        const { email, password } = elements;
        if (await AuthService.signin(email, password, null)) {
            form.reset();
            alert(0, `Welcome back ${email}`);
        }
    });
});