(()=>{var i=class c{static base64={decode(t,e=!1){e&&(t=t.replace(/-/g,"+").replace(/_/g,"/"),t=t.padEnd(t.length+(4-t.length%4)%4,"="));let n=self.atob(t);return Uint8Array.from(n,r=>r.charCodeAt(0))},encode(t,e=!1){let n=self.btoa(String.fromCharCode(...new Uint8Array(t)));return e?n.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""):n}};static base32={decode(t){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",n=[],r=0,s=0;for(let a of t){let o=e.indexOf(a);o!==-1&&(r=r<<5|o,s+=5,s>=8&&(n.push(r>>s-8&255),s-=8))}return new Uint8Array(n)},encode(t){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",n="",r=0,s=0;for(let a of t)for(r=r<<8|a,s+=8;s>=5;)n+=e[r>>s-5&31],s-=5;return s>0&&(n+=e[r<<5-s&31]),n}};static hex={_hex(t){return t.match(/.{1,2}/g).map(e=>String.fromCharCode(parseInt(e,16))).join("")},hex_(t){return Array.from(t).map(e=>e.charCodeAt(0).toString(16).padStart(2,"0")).join("")},decode(t){if(t=t.replace(/\s+/g,"").toLowerCase(),t.length%2!==0)throw new Error("Hex string must have an even length");let e=t.length/2,n=new Uint8Array(e);for(let r=0;r<e;r++)n[r]=parseInt(t.substr(r*2,2),16);return n},encode(t){return Array.from(t).map(e=>e.toString(16).padStart(2,"0")).join("")}};static txt={from(t){return new TextEncoder().encode(t)},to(t){return new TextDecoder().decode(t)},base64_(t){let e=new TextEncoder().encode(t);return Buffer.base64._bytes(e)},_base64(t){let e=Buffer.base64.bytes_(t);return new TextDecoder().decode(e)},Uint16_(t){let e=typeof t=="string"?this.bytes_(t):t,n=e.length,r=n+n%2,s=new Uint16Array(r/2);for(let a=0;a<n;a+=2)s[a/2]=(e[a]|e[a+1]<<8)>>>0;return s}};static bigint={decode(t){let e=Math.ceil(t.toString(2).length/8),n=new Uint8Array(e);for(let r=0;r<e;r++)n[r]=Number(t&255n),t>>=8n;return n.reverse()},encode(t){let e=0n,n=t.length;for(let r=0;r<n;r++)e=e<<8n|BigInt(t[r]);return e}};static pem={encode(t,e){let n=c.base64.encode(t);return`-----BEGIN ${e}-----
${n}
-----END ${e}-----`}};static merge(t,e){let n=0;for(let a of t)n+=a.length;let r;switch(e){case 8:r=new Uint8Array(n);break;case 16:r=new Uint16Array(n);break;case 32:r=new Uint32Array(n);break;default:throw new Error("Invalid size")}let s=0;for(let a of t)r.set(a,s),s+=a.length;return r}static compare(t,e){if(t.length!==e.length)return!1;let n=0;for(let r=0;r<t.length;r++)n|=t[r]^e[r];return n===0}};var l=class{static encoding(t,e){switch(e){case"hex":return i.hex.encode(t);case"base64":return i.base64.encode(t);case"base62":return i.base62.encode(t);case"base64url":return i.base64.encode(t,!0);case"base32":return i.base32.encode(t);default:return t}}static random_bytes(t,e=null){let n=self.crypto.getRandomValues(new Uint8Array(t));return this.encoding(n,e)}static random_ratio(){return self.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296}static random_alphanumeric_code(t=20,e="-"){let n="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",r="";for(let s=0;s<t;s++)r+=n[Math.floor(this.random_ratio()*n.length)];return e?r.match(/.{1,4}/g).join(e):r}static async hmac(t,e,n={}){let r=t instanceof Uint8Array?t:new TextEncoder().encode(t),s=await self.crypto.subtle.importKey("raw",e,{name:"HMAC",hash:{name:n.algo||"SHA-256"}},!1,["sign"]),a=await self.crypto.subtle.sign("HMAC",s,r);return this.encoding(new Uint8Array(a),n.encoding)}static async hash(t,e={}){let n=await self.crypto.subtle.digest({name:e.algorithm||"SHA-256"},t instanceof Uint8Array?t:new TextEncoder().encode(t));return this.encoding(new Uint8Array(n),e.encoding)}static async HKDF(t,e,n=new Uint8Array,r=256){let s=await self.crypto.subtle.importKey("raw",t,{name:"HKDF"},!1,["deriveKey"]),a=await self.crypto.subtle.deriveKey({name:"HKDF",salt:e,info:n,hash:"SHA-256"},s,{name:"AES-GCM",length:r},!0,["encrypt","decrypt"]);return new Uint8Array(await self.crypto.subtle.exportKey("raw",a))}static async deriveKey(t,e,n=1e5,r=32){let s=t instanceof Uint8Array?t:new TextEncoder().encode(t),a=await self.crypto.subtle.importKey("raw",s,{name:"PBKDF2"},!1,["deriveKey"]),o=await self.crypto.subtle.deriveKey({name:"PBKDF2",salt:e,iterations:n,hash:"SHA-256"},a,{name:"AES-GCM",length:r*8},!0,["encrypt","decrypt"]);return new Uint8Array(await self.crypto.subtle.exportKey("raw",o))}static truncateBuffer(t,e,n="start"){if(!(t instanceof Uint8Array))throw new TypeError("Expected a Uint8Array");if(e>=t.length)return t;switch(n){case"start":return t.slice(0,e);case"end":return t.slice(t.length-e);case"middle":{let r=Math.floor((t.length-e)/2);return t.slice(r,r+e)}case"smart":{let r=Math.floor(e/2),s=t.slice(0,r),a=t.slice(t.length-(e-r)),o=new Uint8Array(e);return o.set(s),o.set(a,r),o}default:throw new Error(`Unknown truncation mode: ${n}`)}}static async generate_key_pair(t,e=2048,n=!1){let r;switch(t){case"RSA":r={name:"RSA-OAEP",modulusLength:e,publicExponent:new Uint8Array([1,0,1]),hash:{name:"SHA-256"}};break;case"ECDSA":r={name:"ECDSA",namedCurve:"P-256"};break;default:return-1}try{let s=t==="RSA"?["encrypt","decrypt"]:["sign","verify"],a=await self.crypto.subtle.generateKey(r,!0,s),o=await self.crypto.subtle.exportKey("spki",a.publicKey),d=await self.crypto.subtle.exportKey("pkcs8",a.privateKey);return{public:n?i.pem.encode(o,"PUBLIC KEY"):o,private:n?i.pem.encode(d,"PRIVATE KEY"):d}}catch(s){throw console.warn("Error generating key pair",s),new Error("Error generating key pair")}}};var u=class{async code(t,e=30,n=0){let r=Math.floor((Date.now()/1e3+n*e)/e),s=new Uint8Array(8);for(let h=7;h>=0;h--)s[h]=r&255,r>>=8;let a=await l.hmac(s,t,{algo:"SHA-1"}),o=a[19]&15;return(((a[o]&127)<<24|(a[o+1]&255)<<16|(a[o+2]&255)<<8|a[o+3]&255)%1e6).toString().padStart(6,"0")}};var p=class{constructor(){this.searchActive=!1,this.targetInput=null,this.currentQuery="",this.vaultSelector=null,this.debounceTimeout=null,this.selectedIndex=0}init(){if(this.vaultSelector)return;document.addEventListener("keydown",this.handleKeyDown.bind(this));let t=document.createElement("style");t.textContent=`
  :root { --vve-hover-color: #444 }
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

  #vault-selector .vault-entry:hover,
  #vault-selector .vault-entry.active {
    background-color: var(--vve-hover-color);
  }

  #vault-selector .vault-entry span {
    color: #aaa;
    font-size: 13px;
  }
`,document.head.appendChild(t),this.vaultSelector=document.createElement("div"),this.vaultSelector.id="vault-selector",document.body.appendChild(this.vaultSelector),document.addEventListener("click",async e=>{let n=e.target.closest(".vve-totp");if(n){let o=n.closest(".vault-entry")?._vaultData;o?.secrets?.O&&this.insertTotp(o);return}let r=e.target.closest("#vault-selector .vault-entry");if(!r||e.target.classList.contains("vve-totp"))return;let s=r._vaultData;s&&this.handleVaultSelection(s)})}async handleKeyDown(t){let e=t.ctrlKey&&t.key==="\xF9"&&t.altKey,n=t.ctrlKey&&t.key==="\xF9";if(e||n){if(t.preventDefault(),this.searchActive=!this.searchActive,console.log(`[v] Search is ${this.searchActive?"active":"inactive"}`),this.searchActive){if(this.targetInput=document.activeElement,this.targetInput&&this.targetInput.shadowRoot){let r=this.targetInput.shadowRoot.querySelector("input, textarea");r&&(this.targetInput=r)}if(!this.targetInput||this.targetInput.tagName!=="INPUT"||this.targetInput.type==="password"){this.searchActive=!1;return}this.targetInput.addEventListener("blur",this.handleTargetBlur.bind(this)),clearTimeout(this.debounceTimeout),this.currentQuery=this.targetInput.value.trim(),this.debounceTimeout=setTimeout(()=>{this.fetchVaults({query:this.currentQuery,totpOnly:e})},150)}this.searchActive||this.closeVaultSelector();return}if(this.searchActive&&this.targetInput){if(t.key==="Escape"){t.preventDefault(),this.searchActive=!1,this.closeVaultSelector();return}if(this.searchActive&&t.key==="ArrowUp"){t.preventDefault(),this.moveSelection(-1);return}if(this.searchActive&&t.key==="ArrowDown"){t.preventDefault(),this.moveSelection(1);return}if(t.ctrlKey&&t.key==="i"){t.preventDefault();let s=this.vaultSelector?.children[this.selectedIndex];if(!s||!s._vaultData)return;this.handleVaultSelection(s._vaultData);return}if(t.ctrlKey&&t.key==="\xF2"){t.preventDefault();let s=this.vaultSelector?.children[this.selectedIndex];if(!s||!s._vaultData)return;this.insertTotp(s._vaultData);return}if(!(t.key.length===1||t.key==="Backspace"))return;this.currentQuery=this.targetInput.value.trim(),await this.fetchVaults({query:this.currentQuery})}}moveSelection(t){let e=this.vaultSelector?.children;!e||e.length===0||(e[this.selectedIndex]?.classList.remove("active"),this.selectedIndex+=t,this.selectedIndex<0&&(this.selectedIndex=e.length-1),this.selectedIndex>=e.length&&(this.selectedIndex=0),e[this.selectedIndex]?.classList.add("active"))}handleTargetBlur(){this.searchActive&&setTimeout(()=>{this.searchActive=!1,this.closeVaultSelector()},500)}handleVaultSelection(t){if(!this.targetInput)return;this.smartFillInput(this.targetInput,t.secrets.U);let e=null,n=this.targetInput.closest("form");if(n&&(e=n.querySelector('input[type="password"]')),!e){let r=[...document.querySelectorAll('input[type="password"]')];e=this.findNearest(r)}if(!e){let r=[...Array.from(document.querySelectorAll("*")).filter(s=>s.shadowRoot).map(s=>s.shadowRoot.querySelector('input[type="password"]')).filter(Boolean)];e=this.findNearest(r)}e?(this.smartFillInput(e,t.secrets.P),this.searchActive=!1):(navigator.clipboard.writeText(t.secrets.P),alert("Not able to auto fill, password copied to clipboard")),this.closeVaultSelector()}findNearest(t,e=this.targetInput,n=150){return t.find(r=>{let s=e.getBoundingClientRect(),a=r.getBoundingClientRect();return Math.abs(s.top-a.top)<n})}smartFillInput(t,e){if(!t)return;let n=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;n?n.call(t,e):t.value=e,t.dispatchEvent(new Event("input",{bubbles:!0})),t.dispatchEvent(new Event("change",{bubbles:!0}))}async insertTotp(t){let e=new u,n=i.base32.decode(t.secrets.O),r=await e.code(n);r&&this.targetInput&&(this.smartFillInput(this.targetInput,r),this.closeVaultSelector())}async fetchVaults({query:t,totpOnly:e=!1}){try{let n=await chrome.runtime.sendMessage({type:"get-vaults",payload:{name:t,totpOnly:e}});n.success&&n.data instanceof Array?this.showVaultSelector(this.targetInput,n.data,e):this.closeVaultSelector()}catch(n){console.error("Errore nel recupero dei vault:",n)}}showVaultSelector(t,e,n=!1){if(this.attachVaultSelectorTo(t),this.vaultSelector.style.display="flex",e.length===0){this.vaultSelector.innerHTML="<span style='padding: 5px'>No vault, maybe you need to log in</span>";return}this.vaultSelector.innerHTML="",this.selectedIndex=0,e.forEach(r=>{let s=this.renderVaultEntry(r);this.vaultSelector.appendChild(s)}),this.vaultSelector.children[0]&&this.vaultSelector.children[0].classList.add("active")}closeVaultSelector(){this.vaultSelector.style.display="none",this.vaultSelector.innerHTML="",this.targetInput&&this.targetInput.removeEventListener("blur",this.handleTargetBlur)}attachVaultSelectorTo(t){let e=t.getBoundingClientRect();this.vaultSelector.style.top=`${e.bottom+window.scrollY+4}px`,this.vaultSelector.style.left=`${e.left+window.scrollX}px`,this.vaultSelector.style.width=`${e.width}px`}renderVaultEntry(t){let e=document.createElement("div");return e.className="vault-entry",e.innerHTML=`<div class="vve-info"><strong>${t.secrets.T??"No title"}</strong><span>${t.secrets.U??"no username"}</span></div>
        ${t.secrets.O?'<button class="vve-totp" title="Insert TOTP code">TOTP</button>':""}`,e._vaultData=t,e}};console.log("Vault Content Script Enabled");var f=new p;f.init();})();
