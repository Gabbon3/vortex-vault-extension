(()=>{var c=class u{static base64={decode(t,e=!1){e&&(t=t.replace(/-/g,"+").replace(/_/g,"/"),t=t.padEnd(t.length+(4-t.length%4)%4,"="));let r=self.atob(t);return Uint8Array.from(r,n=>n.charCodeAt(0))},encode(t,e=!1){let r=self.btoa(String.fromCharCode(...new Uint8Array(t)));return e?r.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""):r}};static base32={decode(t){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",r=[],n=0,a=0;for(let s of t){let o=e.indexOf(s);o!==-1&&(n=n<<5|o,a+=5,a>=8&&(r.push(n>>a-8&255),a-=8))}return new Uint8Array(r)},encode(t){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",r="",n=0,a=0;for(let s of t)for(n=n<<8|s,a+=8;a>=5;)r+=e[n>>a-5&31],a-=5;return a>0&&(r+=e[n<<5-a&31]),r}};static hex={_hex(t){return t.match(/.{1,2}/g).map(e=>String.fromCharCode(parseInt(e,16))).join("")},hex_(t){return Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,"0")).join("")},decode(t){if(t=t.replace(/\s+/g,"").toLowerCase(),t.length%2!==0)throw new Error("Hex string must have an even length");let e=t.length/2,r=new Uint8Array(e);for(let n=0;n<e;n++)r[n]=parseInt(t.substr(n*2,2),16);return r},encode(t){return Array.from(t).map(e=>e.toString(16).padStart(2,"0")).join("")}};static txt={from(t){return new TextEncoder().encode(t)},to(t){return new TextDecoder().decode(t)},base64_(t){let e=new TextEncoder().encode(t);return Buffer.base64._bytes(e)},_base64(t){let e=Buffer.base64.bytes_(t);return new TextDecoder().decode(e)},Uint16_(t){let e=typeof t=="string"?this.bytes_(t):t,r=e.length,n=r+r%2,a=new Uint16Array(n/2);for(let s=0;s<r;s+=2)a[s/2]=(e[s]|e[s+1]<<8)>>>0;return a}};static bigint={decode(t){let e=Math.ceil(t.toString(2).length/8),r=new Uint8Array(e);for(let n=0;n<e;n++)r[n]=Number(t&255n),t>>=8n;return r.reverse()},encode(t){let e=0n,r=t.length;for(let n=0;n<r;n++)e=e<<8n|BigInt(t[n]);return e}};static pem={encode(t,e){let r=u.base64.encode(t);return`-----BEGIN ${e}-----
${r}
-----END ${e}-----`}};static merge(t,e){let r=0;for(let s of t)r+=s.length;let n;switch(e){case 8:n=new Uint8Array(r);break;case 16:n=new Uint16Array(r);break;case 32:n=new Uint32Array(r);break;default:throw new Error("Invalid size")}let a=0;for(let s of t)n.set(s,a),a+=s.length;return n}static compare(t,e){if(t.length!==e.length)return!1;let r=0;for(let n=0;n<t.length;n++)r|=t[n]^e[n];return r===0}};var d=class{static encoding(t,e){switch(e){case"hex":return c.hex.encode(t);case"base64":return c.base64.encode(t);case"base62":return c.base62.encode(t);case"base64url":return c.base64.encode(t,!0);case"base32":return c.base32.encode(t);default:return t}}static random_bytes(t,e=null){let r=self.crypto.getRandomValues(new Uint8Array(t));return this.encoding(r,e)}static random_ratio(){return self.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296}static random_alphanumeric_code(t=20,e="-"){let r="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",n="";for(let a=0;a<t;a++)n+=r[Math.floor(this.random_ratio()*r.length)];return e?n.match(/.{1,4}/g).join(e):n}static async hmac(t,e,r={}){let n=t instanceof Uint8Array?t:new TextEncoder().encode(t),a=await self.crypto.subtle.importKey("raw",e,{name:"HMAC",hash:{name:r.algo||"SHA-256"}},!1,["sign"]),s=await self.crypto.subtle.sign("HMAC",a,n);return this.encoding(new Uint8Array(s),r.encoding)}static async hash(t,e={}){let r=await self.crypto.subtle.digest({name:e.algorithm||"SHA-256"},t instanceof Uint8Array?t:new TextEncoder().encode(t));return this.encoding(new Uint8Array(r),e.encoding)}static async HKDF(t,e,r=new Uint8Array,n=256){let a=await self.crypto.subtle.importKey("raw",t,{name:"HKDF"},!1,["deriveKey"]),s=await self.crypto.subtle.deriveKey({name:"HKDF",salt:e,info:r,hash:"SHA-256"},a,{name:"AES-GCM",length:n},!0,["encrypt","decrypt"]);return new Uint8Array(await self.crypto.subtle.exportKey("raw",s))}static async deriveKey(t,e,r=1e5,n=32){let a=t instanceof Uint8Array?t:new TextEncoder().encode(t),s=await self.crypto.subtle.importKey("raw",a,{name:"PBKDF2"},!1,["deriveKey"]),o=await self.crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:r,hash:"SHA-256"},s,{name:"AES-GCM",length:n*8},!0,["encrypt","decrypt"]);return new Uint8Array(await self.crypto.subtle.exportKey("raw",o))}static truncateBuffer(t,e,r="start"){if(!(t instanceof Uint8Array))throw new TypeError("Expected a Uint8Array");if(e>=t.length)return t;switch(r){case"start":return t.slice(0,e);case"end":return t.slice(t.length-e);case"middle":{let n=Math.floor((t.length-e)/2);return t.slice(n,n+e)}case"smart":{let n=Math.floor(e/2),a=t.slice(0,n),s=t.slice(t.length-(e-n)),o=new Uint8Array(e);return o.set(a),o.set(s,n),o}default:throw new Error(`Unknown truncation mode: ${r}`)}}static async generate_key_pair(t,e=2048,r=!1){let n;switch(t){case"RSA":n={name:"RSA-OAEP",modulusLength:e,publicExponent:new Uint8Array([1,0,1]),hash:{name:"SHA-256"}};break;case"ECDSA":n={name:"ECDSA",namedCurve:"P-256"};break;default:return-1}try{let a=t==="RSA"?["encrypt","decrypt"]:["sign","verify"],s=await self.crypto.subtle.generateKey(n,!0,a),o=await self.crypto.subtle.exportKey("spki",s.publicKey),i=await self.crypto.subtle.exportKey("pkcs8",s.privateKey);return{public:r?c.pem.encode(o,"PUBLIC KEY"):o,private:r?c.pem.encode(i,"PRIVATE KEY"):i}}catch(a){throw console.warn("Error generating key pair",a),new Error("Error generating key pair")}}};var h=class{async code(t,e=30,r=0){let n=Math.floor((Date.now()/1e3+r*e)/e),a=new Uint8Array(8);for(let l=7;l>=0;l--)a[l]=n&255,n>>=8;let s=await d.hmac(a,t,{algo:"SHA-1"}),o=s[19]&15;return(((s[o]&127)<<24|(s[o+1]&255)<<16|(s[o+2]&255)<<8|s[o+3]&255)%1e6).toString().padStart(6,"0")}};var p=class{constructor(){this.searchActive=!1,this.targetInput=null,this.currentQuery="",this.vaultSelector=null,this.debounceTimeout=null}init(){if(this.vaultSelector)return;document.addEventListener("keydown",this.handleKeyDown.bind(this));let t=document.createElement("style");t.textContent=`
  #vault-selector {
    position: absolute;
    display: none;
    flex-direction: column;
    z-index: 99999;
    background: #333;
    color: #aaa;
    border: 1px solid #888;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    font-family: sans-serif;
    font-size: 14px;
    max-width: 400px;
    min-width: 200px;
    max-height: 350px;
    overflow-y: scroll;
    scrollbar-width: none;
  }

  #vault-selector::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }

  #vault-selector .vault-entry {
    display: flex;
    flex-direction: row;
    gap: 4px;
    padding: 8px 12px;
    color: #fff;
    cursor: pointer;
    width: 100%;
  }

  #vault-selector .vault-entry .vve-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  #vault-selector .vault-entry .vve-totp {
    margin-left: auto;
    background-color: #444;
    color: #eee;
    border: 1px solid #555;
    border-radius: 5px;
    padding: 5px;
    cursor: pointer;
  }

  #vault-selector .vault-entry:hover {
    background-color: #383838;
  }

  #vault-selector .vault-entry span {
    color: #aaa;
    font-size: 13px;
  }
`,document.head.appendChild(t),this.vaultSelector=document.createElement("div"),this.vaultSelector.id="vault-selector",document.body.appendChild(this.vaultSelector),document.addEventListener("click",async e=>{let r=e.target.closest(".vve-totp");if(r){let o=r.closest(".vault-entry")?._vaultData;if(o?.secrets?.O){let i=new h,l=c.base32.decode(o.secrets.O),f=await i.code(l);f&&this.targetInput&&(this.smartFillInput(this.targetInput,f),this.closeVaultSelector())}return}let n=e.target.closest("#vault-selector .vault-entry");if(!n||e.target.classList.contains("vve-totp"))return;let a=n._vaultData;a&&this.handleVaultSelection(a)})}async handleKeyDown(t){let e=t.ctrlKey&&t.key==="\xF9"&&t.altKey,r=t.ctrlKey&&t.key==="\xF9";if(e||r){if(t.preventDefault(),this.searchActive=!this.searchActive,console.log(`[v] Search is ${this.searchActive?"active":"inactive"}`),this.searchActive){if(this.targetInput=document.activeElement,this.targetInput.addEventListener("blur",this.handleTargetBlur.bind(this)),!this.targetInput||this.targetInput.tagName!=="INPUT"||this.targetInput.type==="password"){this.searchActive=!1;return}clearTimeout(this.debounceTimeout),this.currentQuery=this.targetInput.value.trim(),this.debounceTimeout=setTimeout(()=>{this.fetchVaults({query:this.currentQuery,totpOnly:e})},150)}this.searchActive||this.closeVaultSelector();return}if(this.searchActive&&this.targetInput){if(t.key==="Escape"){this.searchActive=!1,this.closeVaultSelector();return}if(t.ctrlKey&&t.key==="Enter"){let a=this.vaultSelector?.querySelector(".vault-entry");a&&a._vaultData&&this.handleVaultSelection(a._vaultData);return}if(!(t.key.length===1||t.key==="Backspace"))return;this.currentQuery=this.targetInput.value.trim(),await this.fetchVaults({query:this.currentQuery})}}handleTargetBlur(){this.searchActive&&setTimeout(()=>{this.searchActive=!1,this.closeVaultSelector()},500)}handleVaultSelection(t){if(!this.targetInput)return;this.smartFillInput(this.targetInput,t.secrets.U);let e=null,r=this.targetInput.closest("form");r&&(e=r.querySelector('input[type="password"]')),e||(e=[...document.querySelectorAll('input[type="password"]')].find(a=>{let s=this.targetInput.getBoundingClientRect(),o=a.getBoundingClientRect();return Math.abs(s.top-o.top)<150})),e?(this.smartFillInput(e,t.secrets.P),this.searchActive=!1):(navigator.clipboard.writeText(t.secrets.P),alert("Not able to auto fill, password copied to clipboard")),this.closeVaultSelector()}smartFillInput(t,e){if(!t)return;let r=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;r?r.call(t,e):t.value=e,t.dispatchEvent(new Event("input",{bubbles:!0})),t.dispatchEvent(new Event("change",{bubbles:!0}))}async fetchVaults({query:t,totpOnly:e=!1}){try{let r=await chrome.runtime.sendMessage({type:"get-vaults",payload:{name:t,totpOnly:e}});r.success&&r.data instanceof Array?this.showVaultSelector(this.targetInput,r.data,e):this.closeVaultSelector()}catch(r){console.error("Errore nel recupero dei vault:",r)}}showVaultSelector(t,e,r=!1){if(this.attachVaultSelectorTo(t),this.vaultSelector.style.display="flex",e.length===0){this.vaultSelector.innerHTML="<span style='padding: 5px'>No vault, maybe you need to log in</span>";return}this.vaultSelector.innerHTML="",e.forEach(n=>{let a=this.renderVaultEntry(n);this.vaultSelector.appendChild(a)})}closeVaultSelector(){this.vaultSelector.style.display="none",this.vaultSelector.innerHTML="",this.targetInput&&this.targetInput.removeEventListener("blur",this.handleTargetBlur)}attachVaultSelectorTo(t){let e=t.getBoundingClientRect();this.vaultSelector.style.top=`${e.bottom+window.scrollY+4}px`,this.vaultSelector.style.left=`${e.left+window.scrollX}px`,this.vaultSelector.style.width=`${e.width}px`}renderVaultEntry(t){let e=document.createElement("div");return e.className="vault-entry",e.innerHTML=`<div class="vve-info"><strong>${t.secrets.T??"No title"}</strong><span>${t.secrets.U??"no username"}</span></div>
        ${t.secrets.O?'<button class="vve-totp" title="Insert TOTP code">TOTP</button>':""}`,e._vaultData=t,e}};console.log("Vault Content Script Enabled");var y=new p;y.init();})();
