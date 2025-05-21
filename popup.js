document.querySelector('#signin').addEventListener('submit', (e) => {
    e.preventDefault();
    // ---
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    // ---
    chrome.runtime.sendMessage({
        action: "vault-login",
        payload: { email, password }
    });
});