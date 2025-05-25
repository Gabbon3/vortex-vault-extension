(()=>{var c=class i{static base64={decode(e,t=!1){t&&(e=e.replace(/-/g,"+").replace(/_/g,"/"),e=e.padEnd(e.length+(4-e.length%4)%4,"="));let r=self.atob(e);return Uint8Array.from(r,n=>n.charCodeAt(0))},encode(e,t=!1){let r=self.btoa(String.fromCharCode(...new Uint8Array(e)));return t?r.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""):r}};static base32={decode(e){let t="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",r=[],n=0,s=0;for(let a of e){let o=t.indexOf(a);o!==-1&&(n=n<<5|o,s+=5,s>=8&&(r.push(n>>s-8&255),s-=8))}return new Uint8Array(r)},encode(e){let t="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",r="",n=0,s=0;for(let a of e)for(n=n<<8|a,s+=8;s>=5;)r+=t[n>>s-5&31],s-=5;return s>0&&(r+=t[n<<5-s&31]),r}};static hex={_hex(e){return e.match(/.{1,2}/g).map(t=>String.fromCharCode(parseInt(t,16))).join("")},hex_(e){return Array.from(e).map(t=>t.charCodeAt(0).toString(16).padStart(2,"0")).join("")},decode(e){if(e=e.replace(/\s+/g,"").toLowerCase(),e.length%2!==0)throw new Error("Hex string must have an even length");let t=e.length/2,r=new Uint8Array(t);for(let n=0;n<t;n++)r[n]=parseInt(e.substr(n*2,2),16);return r},encode(e){return Array.from(e).map(t=>t.toString(16).padStart(2,"0")).join("")}};static txt={from(e){return new TextEncoder().encode(e)},to(e){return new TextDecoder().decode(e)},base64_(e){let t=new TextEncoder().encode(e);return Buffer.base64._bytes(t)},_base64(e){let t=Buffer.base64.bytes_(e);return new TextDecoder().decode(t)},Uint16_(e){let t=typeof e=="string"?this.bytes_(e):e,r=t.length,n=r+r%2,s=new Uint16Array(n/2);for(let a=0;a<r;a+=2)s[a/2]=(t[a]|t[a+1]<<8)>>>0;return s}};static bigint={decode(e){let t=Math.ceil(e.toString(2).length/8),r=new Uint8Array(t);for(let n=0;n<t;n++)r[n]=Number(e&255n),e>>=8n;return r.reverse()},encode(e){let t=0n,r=e.length;for(let n=0;n<r;n++)t=t<<8n|BigInt(e[n]);return t}};static pem={encode(e,t){let r=i.base64.encode(e);return`-----BEGIN ${t}-----
${r}
-----END ${t}-----`}};static merge(e,t){let r=0;for(let a of e)r+=a.length;let n;switch(t){case 8:n=new Uint8Array(r);break;case 16:n=new Uint16Array(r);break;case 32:n=new Uint32Array(r);break;default:throw new Error("Invalid size")}let s=0;for(let a of e)n.set(a,s),s+=a.length;return n}static compare(e,t){if(e.length!==t.length)return!1;let r=0;for(let n=0;n<e.length;n++)r|=e[n]^t[n];return r===0}};var u=class{static encoding(e,t){switch(t){case"hex":return c.hex.encode(e);case"base64":return c.base64.encode(e);case"base62":return c.base62.encode(e);case"base64url":return c.base64.encode(e,!0);case"base32":return c.base32.encode(e);default:return e}}static random_bytes(e,t=null){let r=self.crypto.getRandomValues(new Uint8Array(e));return this.encoding(r,t)}static random_ratio(){return self.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296}static random_alphanumeric_code(e=20,t="-"){let r="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",n="";for(let s=0;s<e;s++)n+=r[Math.floor(this.random_ratio()*r.length)];return t?n.match(/.{1,4}/g).join(t):n}static async hmac(e,t,r={}){let n=e instanceof Uint8Array?e:new TextEncoder().encode(e),s=await self.crypto.subtle.importKey("raw",t,{name:"HMAC",hash:{name:r.algo||"SHA-256"}},!1,["sign"]),a=await self.crypto.subtle.sign("HMAC",s,n);return this.encoding(new Uint8Array(a),r.encoding)}static async hash(e,t={}){let r=await self.crypto.subtle.digest({name:t.algorithm||"SHA-256"},e instanceof Uint8Array?e:new TextEncoder().encode(e));return this.encoding(new Uint8Array(r),t.encoding)}static async HKDF(e,t,r=new Uint8Array,n=256){let s=await self.crypto.subtle.importKey("raw",e,{name:"HKDF"},!1,["deriveKey"]),a=await self.crypto.subtle.deriveKey({name:"HKDF",salt:t,info:r,hash:"SHA-256"},s,{name:"AES-GCM",length:n},!0,["encrypt","decrypt"]);return new Uint8Array(await self.crypto.subtle.exportKey("raw",a))}static async deriveKey(e,t,r=1e5,n=32){let s=e instanceof Uint8Array?e:new TextEncoder().encode(e),a=await self.crypto.subtle.importKey("raw",s,{name:"PBKDF2"},!1,["deriveKey"]),o=await self.crypto.subtle.deriveKey({name:"PBKDF2",salt:t,iterations:r,hash:"SHA-256"},a,{name:"AES-GCM",length:n*8},!0,["encrypt","decrypt"]);return new Uint8Array(await self.crypto.subtle.exportKey("raw",o))}static truncateBuffer(e,t,r="start"){if(!(e instanceof Uint8Array))throw new TypeError("Expected a Uint8Array");if(t>=e.length)return e;switch(r){case"start":return e.slice(0,t);case"end":return e.slice(e.length-t);case"middle":{let n=Math.floor((e.length-t)/2);return e.slice(n,n+t)}case"smart":{let n=Math.floor(t/2),s=e.slice(0,n),a=e.slice(e.length-(t-n)),o=new Uint8Array(t);return o.set(s),o.set(a,n),o}default:throw new Error(`Unknown truncation mode: ${r}`)}}static async generate_key_pair(e,t=2048,r=!1){let n;switch(e){case"RSA":n={name:"RSA-OAEP",modulusLength:t,publicExponent:new Uint8Array([1,0,1]),hash:{name:"SHA-256"}};break;case"ECDSA":n={name:"ECDSA",namedCurve:"P-256"};break;default:return-1}try{let s=e==="RSA"?["encrypt","decrypt"]:["sign","verify"],a=await self.crypto.subtle.generateKey(n,!0,s),o=await self.crypto.subtle.exportKey("spki",a.publicKey),l=await self.crypto.subtle.exportKey("pkcs8",a.privateKey);return{public:r?c.pem.encode(o,"PUBLIC KEY"):o,private:r?c.pem.encode(l,"PRIVATE KEY"):l}}catch(s){throw console.warn("Error generating key pair",s),new Error("Error generating key pair")}}};var d=class{async code(e,t=30,r=0){let n=Math.floor((Date.now()/1e3+r*t)/t),s=new Uint8Array(8);for(let h=7;h>=0;h--)s[h]=n&255,n>>=8;let a=await u.hmac(s,e,{algo:"SHA-1"}),o=a[19]&15;return(((a[o]&127)<<24|(a[o+1]&255)<<16|(a[o+2]&255)<<8|a[o+3]&255)%1e6).toString().padStart(6,"0")}};var p=class{constructor(){this.searchActive=!1,this.targetInput=null,this.currentQuery="",this.vaultSelector=null,this.debounceTimeout=null,this.selectedIndex=0}init(){if(this.vaultSelector)return;document.addEventListener("keydown",this.handleKeyDown.bind(this));let e=document.createElement("style");e.textContent=`
  :root { --vve-hover-color: #383838 }
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
`,document.head.appendChild(e),this.vaultSelector=document.createElement("div"),this.vaultSelector.id="vault-selector",document.body.appendChild(this.vaultSelector),document.addEventListener("click",async t=>{let r=t.target.closest(".vve-totp");if(r){let o=r.closest(".vault-entry")?._vaultData;o?.secrets?.O&&this.insertTotp(o);return}let n=t.target.closest("#vault-selector .vault-entry");if(!n||t.target.classList.contains("vve-totp"))return;let s=n._vaultData;s&&this.handleVaultSelection(s)})}async handleKeyDown(e){let t=e.ctrlKey&&e.key==="\xF9"&&e.altKey,r=e.ctrlKey&&e.key==="\xF9";if(t||r){if(e.preventDefault(),this.searchActive=!this.searchActive,console.log(`[v] Search is ${this.searchActive?"active":"inactive"}`),this.searchActive){if(this.targetInput=document.activeElement,this.targetInput.addEventListener("blur",this.handleTargetBlur.bind(this)),!this.targetInput||this.targetInput.tagName!=="INPUT"||this.targetInput.type==="password"){this.searchActive=!1;return}clearTimeout(this.debounceTimeout),this.currentQuery=this.targetInput.value.trim(),this.debounceTimeout=setTimeout(()=>{this.fetchVaults({query:this.currentQuery,totpOnly:t})},150)}this.searchActive||this.closeVaultSelector();return}if(this.searchActive&&this.targetInput){if(e.key==="Escape"){e.preventDefault(),this.searchActive=!1,this.closeVaultSelector();return}if(this.searchActive&&e.key==="ArrowUp"){e.preventDefault(),this.moveSelection(-1);return}if(this.searchActive&&e.key==="ArrowDown"){e.preventDefault(),this.moveSelection(1);return}if(e.ctrlKey&&e.key==="i"){e.preventDefault();let s=this.vaultSelector?.children[this.selectedIndex];s&&s._vaultData&&this.handleVaultSelection(s._vaultData);return}if(e.ctrlKey&&e.key==="\xF2"){e.preventDefault();let s=this.vaultSelector?.children[this.selectedIndex];s&&s._vaultData?.secrets?.O&&this.insertTotp(s._vaultData);return}if(!(e.key.length===1||e.key==="Backspace"))return;this.currentQuery=this.targetInput.value.trim(),await this.fetchVaults({query:this.currentQuery})}}moveSelection(e){let t=this.vaultSelector?.children;!t||t.length===0||(t[this.selectedIndex]?.classList.remove("active"),this.selectedIndex+=e,this.selectedIndex<0&&(this.selectedIndex=t.length-1),this.selectedIndex>=t.length&&(this.selectedIndex=0),t[this.selectedIndex]?.classList.add("active"))}handleTargetBlur(){this.searchActive&&setTimeout(()=>{this.searchActive=!1,this.closeVaultSelector()},500)}handleVaultSelection(e){if(!this.targetInput)return;this.smartFillInput(this.targetInput,e.secrets.U);let t=null,r=this.targetInput.closest("form");r&&(t=r.querySelector('input[type="password"]')),t||(t=[...document.querySelectorAll('input[type="password"]')].find(s=>{let a=this.targetInput.getBoundingClientRect(),o=s.getBoundingClientRect();return Math.abs(a.top-o.top)<150})),t?(this.smartFillInput(t,e.secrets.P),this.searchActive=!1):(navigator.clipboard.writeText(e.secrets.P),alert("Not able to auto fill, password copied to clipboard")),this.closeVaultSelector()}smartFillInput(e,t){if(!e)return;let r=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value")?.set;r?r.call(e,t):e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0}))}async insertTotp(e){let t=new d,r=c.base32.decode(e.secrets.O),n=await t.code(r);n&&this.targetInput&&(this.smartFillInput(this.targetInput,n),this.closeVaultSelector())}async fetchVaults({query:e,totpOnly:t=!1}){try{let r=await chrome.runtime.sendMessage({type:"get-vaults",payload:{name:e,totpOnly:t}});r.success&&r.data instanceof Array?this.showVaultSelector(this.targetInput,r.data,t):this.closeVaultSelector()}catch(r){console.error("Errore nel recupero dei vault:",r)}}showVaultSelector(e,t,r=!1){if(this.attachVaultSelectorTo(e),this.vaultSelector.style.display="flex",t.length===0){this.vaultSelector.innerHTML="<span style='padding: 5px'>No vault, maybe you need to log in</span>";return}this.vaultSelector.innerHTML="",this.selectedIndex=0,t.forEach(n=>{let s=this.renderVaultEntry(n);this.vaultSelector.appendChild(s)}),this.vaultSelector.children[0]&&this.vaultSelector.children[0].classList.add("active")}closeVaultSelector(){this.vaultSelector.style.display="none",this.vaultSelector.innerHTML="",this.targetInput&&this.targetInput.removeEventListener("blur",this.handleTargetBlur)}attachVaultSelectorTo(e){let t=e.getBoundingClientRect();this.vaultSelector.style.top=`${t.bottom+window.scrollY+4}px`,this.vaultSelector.style.left=`${t.left+window.scrollX}px`,this.vaultSelector.style.width=`${t.width}px`}renderVaultEntry(e){let t=document.createElement("div");return t.className="vault-entry",t.innerHTML=`<div class="vve-info"><strong>${e.secrets.T??"No title"}</strong><span>${e.secrets.U??"no username"}</span></div>
        ${e.secrets.O?'<button class="vve-totp" title="Insert TOTP code">TOTP</button>':""}`,t._vaultData=e,t}};console.log("Vault Content Script Enabled");var f=new p;f.init();})();
