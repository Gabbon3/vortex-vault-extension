export class Config {
    static dev = false;
    // ---
    static origin = this.dev ? 'http://localhost:3000' : 'https://vortexvault.fly.dev'
}