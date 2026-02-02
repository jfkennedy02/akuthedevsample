import{a as L,d}from"./firebase-config-Zcj99KW5.js";/* empty css              *//* empty css                  */import{onAuthStateChanged as D,signOut as B}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";import{getDoc as m,doc as i,onSnapshot as h,collection as b,query as v,where as w,orderBy as M,getDocs as T,updateDoc as l,increment as k}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";import"https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";const g=document.getElementById("users-body"),p=document.getElementById("deposits-body"),y=document.getElementById("withdrawals-body"),u=document.getElementById("kyc-body");D(L,async o=>{if(o){const e=await m(i(d,"users",o.uid));e.exists()&&e.data().role==="admin"?(E(),$(),A(),x()):window.location.href="dashboard.html"}else window.location.href="login.html"});function E(){return console.log("Setting up real-time user listener..."),g.innerHTML='<tr><td colspan="4">Initializing...</td></tr>',h(b(d,"users"),e=>{if(console.log(`User list updated. Total users: ${e.size}`),g.innerHTML="",e.empty){g.innerHTML='<tr><td colspan="4" style="text-align: center;">No users found.</td></tr>';return}e.forEach(r=>{const t=r.data(),n=`
                <tr>
                    <td>${t.email}</td>
                    <td>$${t.balance||0}</td>
                    <td><span class="status-badge status-completed">${t.status||"active"}</span></td>
                    <td>
                        <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="openUserModal('${r.id}')">View</button>
                        <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openEditModal('${r.id}', ${t.balance||0})">Edit Balance</button>
                    </td>
                </tr>
            `;g.innerHTML+=n})},e=>{console.error("Error loading users:",e),g.innerHTML=`<tr><td colspan="4" style="color: var(--error);">Error loading users. Check console. <br> ${e.message}</td></tr>`})}function A(){console.log("Setting up real-time withdrawal listener..."),y.innerHTML='<tr><td colspan="6">Initializing...</td></tr>';const o=v(b(d,"transactions"),w("type","==","withdraw"),w("status","==","Pending"),M("date","desc"));return h(o,async e=>{if(console.log(`Withdrawal list updated. Total pending: ${e.size}`),y.innerHTML="",e.empty){y.innerHTML='<tr><td colspan="6" style="text-align: center;">No pending withdrawals.</td></tr>';return}for(const r of e.docs){const t=r.data();let n="Unknown";try{const a=await m(i(d,"users",t.userId));a.exists()&&(n=a.data().email)}catch{}const s=`
                <tr>
                    <td>${n}</td>
                    <td>$${t.amount}</td>
                    <td>${(t.method||"crypto").toUpperCase()}</td>
                    <td style="font-family: monospace; font-size: 0.8rem;">${t.walletAddress?t.walletAddress.substring(0,10)+"...":"N/A"}</td>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>
                        <button class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="openWithdrawalModal('${r.id}')">Details</button>
                        <button class="btn-primary" style="background-color: var(--success); padding: 0.25rem 0.5rem;" onclick="approveWithdrawal('${r.id}')">Approve</button>
                    </td>
                </tr>
            `;y.innerHTML+=s}},e=>{console.error("Error loading withdrawals:",e),y.innerHTML=`<tr><td colspan="6" style="color: var(--error);">Error: ${e.message}</td></tr>`})}function x(){if(console.log("Setting up real-time KYC listener..."),!u)return;u.innerHTML='<tr><td colspan="4">Initializing...</td></tr>';const o=v(b(d,"users"),w("kycStatus","==","Pending"));return h(o,e=>{if(u.innerHTML="",e.empty){u.innerHTML='<tr><td colspan="4" style="text-align: center;">No pending KYC requests.</td></tr>';return}e.forEach(r=>{var s,a;const t=r.data(),n=`
                <tr>
                    <td>${t.email}</td>
                    <td>${(((s=t.kycData)==null?void 0:s.idType)||"ID Card").replace("_"," ").toUpperCase()}</td>
                    <td>${(a=t.kycData)!=null&&a.submittedAt?new Date(t.kycData.submittedAt).toLocaleDateString():"N/A"}</td>
                    <td>
                        <button class="btn-primary" onclick="openKYCModal('${r.id}')">Review Docs</button>
                    </td>
                </tr>
            `;u.innerHTML+=n})},e=>{console.error("Error loading KYC:",e),u.innerHTML=`<tr><td colspan="4" style="color: var(--error);">Error: ${e.message}</td></tr>`})}async function $(){p.innerHTML='<tr><td colspan="5">Loading...</td></tr>';try{const o=v(b(d,"transactions"),w("type","==","deposit"),w("status","==","Pending"),M("date","desc")),e=await T(o);if(p.innerHTML="",e.empty){p.innerHTML='<tr><td colspan="5" style="text-align: center;">No pending deposits.</td></tr>';return}for(const r of e.docs){const t=r.data();let n="Unknown";try{const a=await m(i(d,"users",t.userId));a.exists()&&(n=a.data().email)}catch{}const s=`
                <tr>
                    <td>${n}</td>
                    <td>$${t.amount}</td>
                    <td>${t.method}</td>
                    <td>${new Date(t.date).toLocaleDateString()}</td>
                    <td>
                        ${t.proofImage||t.proofUrl?`<button class="btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;" onclick="openProofModal('${r.id}')">Proof</button>`:""}
                        ${t.requiresKYC?'<span class="status-badge status-pending" style="margin-right: 0.5rem;">Awaiting KYC</span>':""}
                        <button class="btn-primary" style="background-color: var(--success); padding: 0.25rem 0.5rem;" onclick="approveDeposit('${r.id}', '${t.userId}', ${t.amount})">Approve</button>
                        <button class="btn-primary" style="background-color: var(--error); padding: 0.25rem 0.5rem;" onclick="rejectDeposit('${r.id}')">Reject</button>
                    </td>
                </tr>
            `;p.innerHTML+=s}}catch(o){console.error("Error loading deposits:",o),o.code==="failed-precondition"?p.innerHTML='<tr><td colspan="5" style="color: var(--warning);">MISSING INDEX: Check browser console for the link to create it.</td></tr>':p.innerHTML=`<tr><td colspan="5" style="color: var(--error);">Error: ${o.message}</td></tr>`}}window.openEditModal=(o,e)=>{document.getElementById("edit-user-id").value=o,document.getElementById("edit-balance").value=e,document.getElementById("edit-modal").classList.add("active")};window.closeEditModal=()=>{document.getElementById("edit-modal").classList.remove("active")};window.openUserModal=async o=>{const e=document.getElementById("user-detail-modal"),r=document.getElementById("user-detail-content");r.innerHTML="Loading...",e.classList.add("active");try{const t=await m(i(d,"users",o));if(t.exists()){const n=t.data();r.innerHTML=`
                <p><strong>Full Name:</strong> ${n.fullName||"N/A"}</p>
                <p><strong>Email:</strong> ${n.email}</p>
                <p><strong>Phone:</strong> ${n.phone||"N/A"}</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">
                <p><strong>Address:</strong><br>
                ${n.address||""}<br>
                ${n.city?n.city+", ":""} ${n.state||""} ${n.zip||""}<br>
                ${n.country||""}</p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">
                <p><strong>Default Crypto:</strong> ${(n.defaultCrypto||"N/A").toUpperCase()}</p>
                <p><strong>Default Wallet:</strong> <span style="font-family: monospace; font-size: 0.9rem; word-break: break-all;">${n.defaultWallet||"N/A"}</span></p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">
                <p><strong>Joined:</strong> ${n.createdAt?new Date(n.createdAt.seconds*1e3).toLocaleDateString():"N/A"}</p>
            `}else r.innerHTML="User not found."}catch(t){console.error(t),r.innerHTML="Error loading details."}};window.closeUserModal=()=>{document.getElementById("user-detail-modal").classList.remove("active")};window.openWithdrawalModal=async o=>{const e=document.getElementById("withdrawal-detail-modal"),r=document.getElementById("withdrawal-detail-content"),t=document.getElementById("modal-approve-btn"),n=document.getElementById("modal-reject-btn");r.innerHTML="Loading...",e.classList.add("active");try{const s=await m(i(d,"transactions",o));if(s.exists()){const a=s.data();let f="Unknown User";try{const c=await m(i(d,"users",a.userId));c.exists()&&(f=c.data().email)}catch{}r.innerHTML=`
                <p><strong>User:</strong> ${f}</p>
                <p><strong>Amount:</strong> <span style="color: #fff; font-weight: bold;">$${a.amount}</span></p>
                <p><strong>Crypto:</strong> ${(a.method||"crypto").toUpperCase()}</p>
                <p><strong>Wallet Address:</strong></p>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; font-family: monospace; word-break: break-all; color: var(--primary-color); border: 1px solid rgba(255,255,255,0.1);">
                    ${a.walletAddress||"No address provided"}
                </div>
                <p style="font-size: 0.85rem; margin-top: 1rem;"><strong>Requested:</strong> ${new Date(a.date).toLocaleString()}</p>
            `,t.onclick=()=>{closeWithdrawalModal(),approveWithdrawal(o)},n.onclick=()=>{closeWithdrawalModal(),rejectWithdrawal(o,a.userId,a.amount)}}else r.innerHTML="Transaction not found."}catch(s){console.error(s),r.innerHTML="Error loading transaction details."}};window.closeWithdrawalModal=()=>{document.getElementById("withdrawal-detail-modal").classList.remove("active")};window.openProofModal=async o=>{const e=document.getElementById("proof-modal"),r=document.getElementById("proof-image");try{const t=await m(i(d,"transactions",o));if(t.exists()){const n=t.data(),s=n.proofUrl||n.proofImage;s?(r.src=s,e.classList.add("active")):alert("No proof link found.")}}catch(t){console.error(t),alert("Error loading proof.")}};window.closeProofModal=()=>{document.getElementById("proof-modal").classList.remove("active")};window.approveDeposit=async(o,e,r)=>{if(confirm("Approve this deposit?"))try{await l(i(d,"transactions",o),{status:"Completed"}),await l(i(d,"users",e),{balance:k(r)}),alert("Deposit approved!"),$(),E()}catch(t){console.error("Error approving:",t),alert("Action failed.")}};window.rejectDeposit=async o=>{if(confirm("Reject this deposit?"))try{await l(i(d,"transactions",o),{status:"Rejected"}),alert("Deposit rejected."),$()}catch(e){console.error("Error rejecting:",e)}};window.approveWithdrawal=async o=>{if(confirm("Approve this withdrawal?"))try{await l(i(d,"transactions",o),{status:"Completed"}),alert("Withdrawal approved!")}catch(e){console.error("Error approving withdrawal:",e),alert("Action failed.")}};window.rejectWithdrawal=async(o,e,r)=>{if(confirm("Reject this withdrawal and REFUND the user?"))try{await l(i(d,"transactions",o),{status:"Rejected"}),await l(i(d,"users",e),{balance:k(r)}),alert("Withdrawal rejected and funds refunded to user.")}catch(t){console.error("Error rejecting withdrawal:",t),alert("Action failed.")}};document.getElementById("edit-balance-form").addEventListener("submit",async o=>{o.preventDefault();const e=document.getElementById("edit-user-id").value,r=parseFloat(document.getElementById("edit-balance").value);try{await l(i(d,"users",e),{balance:r}),closeEditModal(),E(),alert("Balance updated.")}catch(t){console.error("Update failed:",t),alert("Update failed.")}});window.openKYCModal=async o=>{const e=document.getElementById("kyc-detail-modal"),r=document.getElementById("kyc-detail-content"),t=document.getElementById("kyc-approve-btn"),n=document.getElementById("kyc-reject-btn");r.innerHTML="Loading documents...",e.classList.add("active");try{const s=await m(i(d,"users",o));if(s.exists()&&s.data().kycData){const a=s.data().kycData,f=s.data();r.innerHTML=`
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.1);">
                    <p style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color); margin-bottom: 0.25rem;">${a.fullName||"No Name Provided"}</p>
                    <p style="color: var(--text-gray); font-size: 0.85rem;">${f.email} • ${a.country||"Unknown Country"}</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-gray); font-weight: bold; text-transform: uppercase;">ID FRONT</p>
                        <img src="${a.idFrontUrl||a.frontImg}" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #222;">
                    </div>
                    <div>
                        <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-gray); font-weight: bold; text-transform: uppercase;">ID BACK</p>
                        <img src="${a.idBackUrl||a.backImg}" style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #222;">
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-gray); font-weight: bold; text-transform: uppercase;">LIVENESS VERIFICATION</p>
                    <video src="${a.liveVideoUrl||a.video}" controls style="width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: #000; max-height: 250px;"></video>
                </div>

                <div style="font-size: 0.9rem; line-height: 1.6;">
                    <p><strong style="color: var(--text-gray);">Document:</strong> ${String(a.idType||"ID").toUpperCase().replace("_"," ")}</p>
                    <p><strong style="color: var(--text-gray);">Submitted:</strong> ${a.submittedAt?a.submittedAt.toDate?a.submittedAt.toDate().toLocaleString():new Date(a.submittedAt).toLocaleString():"N/A"}</p>
                </div>
            `,t.onclick=async()=>{if(confirm("Approve this user identity?"))try{await l(i(d,"users",o),{kycStatus:"Verified"}),alert("User verified!"),closeKYCModal()}catch(c){alert("Error: "+c.message)}},n.onclick=async()=>{const c=prompt("Reason for rejection:");if(c)try{await l(i(d,"users",o),{kycStatus:"Rejected",kycNote:c}),alert("KYC Rejected."),closeKYCModal()}catch(I){alert("Error: "+I.message)}}}else r.innerHTML='<p style="color: var(--error);">No KYC data found for this user.</p>'}catch(s){console.error(s),r.innerHTML='<p style="color: var(--error);">Error loading documents.</p>'}};window.closeKYCModal=()=>{document.getElementById("kyc-detail-modal").classList.remove("active")};document.getElementById("logout-btn").addEventListener("click",()=>B(L));
