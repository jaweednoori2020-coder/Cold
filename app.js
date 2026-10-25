/* حساب سرد خانه عبدالعزیز - vanilla JS, offline first */
const KEY="abdulaziz_coldstore_v1";
const defaultState={
  settings:{name:"حساب سرد خانه عبدالعزیز",capacity:[7500,7500],basketWeight:10,rentRate:20,usd:70,eur:80,font:"medium",theme:"light",colors:{primary:"#18324a",secondary:"#4f6678",accent:"#d4af37",bg:"#eef2f5",card:"#ffffff",text:"#17212b"}},
  partners:[
    {id:uid(),name:"عبدالعزیز",share:33.33},
    {id:uid(),name:"نصرت‌الله",share:33.33},
    {id:uid(),name:"حاجی حسیب",share:33.34}
  ],
  customers:[], movements:[], expenses:[], payments:[], notes:[], rentRows:[], trash:[]
};
let state=load();
let currentPage="dashboard";

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));return s||structuredClone(defaultState)}catch{return structuredClone(defaultState)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));applySettings()}
function money(n){return new Intl.NumberFormat("fa-AF",{maximumFractionDigits:2}).format(Number(n)||0)+" افغانی"}
function num(n){return new Intl.NumberFormat("fa-AF",{maximumFractionDigits:2}).format(Number(n)||0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(s){const el=document.getElementById("toast");el.textContent=s;el.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2200)}
function today(){return new Intl.DateTimeFormat("fa-AF-u-ca-persian",{dateStyle:"medium"}).format(new Date())}
function applySettings(){
  const c=state.settings.colors; const r=document.documentElement;
  Object.entries({primary:c.primary,secondary:c.secondary,accent:c.accent,bg:c.bg,card:c.card,text:c.text}).forEach(([k,v])=>r.style.setProperty("--"+k,v));
  r.style.setProperty("--fontScale",{small:.88,medium:1,large:1.12,xlarge:1.28}[state.settings.font]||1);
  document.body.dataset.theme=state.settings.theme;
  if(state.settings.theme==="dark"){
    r.style.setProperty("--bg","#0e1821");r.style.setProperty("--card","#17242e");r.style.setProperty("--text","#eef5f8");r.style.setProperty("--border","#31414c");
  }
  document.getElementById("today").textContent=today();
}
function capacityUsed(floor){
  return state.movements.filter(m=>Number(m.floor)===floor).reduce((a,m)=>a+(m.type==="in"?Number(m.baskets):-Number(m.baskets)),0);
}
function floorWeight(floor){return capacityUsed(floor)*Number(state.settings.basketWeight)}
function totalRent(){return state.rentRows.reduce((a,r)=>a+Number(r.total||0),0)}
function totalExpenses(){return state.expenses.reduce((a,e)=>a+Number(e.amount||0),0)}
function totalPayments(){return state.payments.reduce((a,p)=>a+Number(p.amount||0),0)}
function netRent(){return totalRent()-totalExpenses()}
function sharesValid(){return Math.abs(state.partners.reduce((a,p)=>a+Number(p.share),0)-100)<0.01}
function page(title,body,actions=""){return `<div class="page-title"><div><h1>${title}</h1><div class="subtitle">${state.settings.name}</div></div>${actions}</div>${body}`}
function render(){
  applySettings();
  const main=document.getElementById("main");
  const pages={dashboard:dashboardPage,coldstore:coldPage,rent:rentPage,customers:customersPage,finance:financePage,tools:toolsPage,settings:settingsPage};
  main.innerHTML=pages[currentPage]();
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===currentPage));
  bindPage();
}
function dashboardPage(){
  const c1=capacityUsed(1),c2=capacityUsed(2),cap1=Number(state.settings.capacity[0]),cap2=Number(state.settings.capacity[1]);
  const totalCap=cap1+cap2, used=c1+c2;
  return `<div class="hero"><img src="profile.jpg"><div><h1>حساب سرد خانه عبدالعزیز</h1><p>مدیریت سردخانه، سیب، مشتریان، مصارف و سهم شرکا</p></div></div>
  <div class="grid">
    ${stat("ظرفیت کل",num(totalCap)+" سبد",num(totalCap*state.settings.basketWeight)+" کیلوگرام")}
    ${stat("سبدهای موجود",num(used)+" سبد",num(totalCap-used)+" سبد خالی")}
    ${stat("درآمد کرایه",money(totalRent()),"قبل از مصارف")}
    ${stat("مجموع مصارف",money(totalExpenses()),"هزینه ثبت‌شده")}
    ${stat("سود خالص",money(netRent()),"کرایه منهای مصارف")}
    ${stat("پرداخت‌ها",money(totalPayments()),"ثبت‌شده")}
    ${stat("مشتریان",num(state.customers.length),"ثبت‌شده")}
    ${stat("شرکا",num(state.partners.length),"فعال")}
  </div>
  <div class="section"><h2>وضعیت طبقات</h2><div class="grid">
    ${floorCard(1,c1,cap1)}${floorCard(2,c2,cap2)}
  </div></div>
  <div class="section"><h2>تقسیم سود فعلی</h2>${shareCards()}</div>`;
}
function stat(label,value,sub){return `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`}
function floorCard(f,u,c){const pct=c?Math.min(100,u/c*100):0;return `<div class="card"><h3>طبقه ${f}</h3><div>${num(u)} / ${num(c)} سبد</div><div class="progress"><span style="width:${pct}%"></span></div><div class="subtitle">${num(u*state.settings.basketWeight)} کیلوگرام • ${num(c-u)} خالی</div></div>`}
function shareCards(){const net=netRent();return `<div class="grid">${state.partners.map(p=>`<div class="card"><h3>${esc(p.name)}</h3><div>${num(p.share)}%</div><div class="value">${money(net*p.share/100)}</div></div>`).join("")}</div>`}

function coldPage(){
 return page("سردخانه",`<div class="grid">${[1,2].map(f=>{
   const cap=Number(state.settings.capacity[f-1]),u=capacityUsed(f);
   return `<div class="card"><h3>طبقه ${f}</h3><div class="badge">${state.settings.floorMode?.[f]||"قابل تنظیم"}</div>
   <div class="section"><b>${num(u)}</b> سبد از ${num(cap)}</div><div class="progress"><span style="width:${cap?u/cap*100:0}%"></span></div>
   <div class="subtitle">${num(u*state.settings.basketWeight)} کیلوگرام (${num(u*state.settings.basketWeight/1000)} تن)</div>
   <div class="actions"><button class="btn" data-action="addMovement" data-floor="${f}" data-type="in">ورود سیب</button><button class="btn secondary" data-action="addMovement" data-floor="${f}" data-type="out">خروج سیب</button></div></div>`
 }).join("")}</div>
 <div class="section card"><h3>قواعد ظرفیت</h3><p class="subtitle">هر طبقه مستقل است. ورود بیش از ظرفیت یا خروج بیش از موجودی پذیرفته نمی‌شود.</p></div>`);
}

function rentPage(){
 const rows=state.rentRows;
 return page("حساب کرایه سردخانه",`<div class="actions"><button class="btn accent" data-action="addRent">+ افزودن مشتری به جدول</button><button class="btn light" data-action="exportRent">خروجی CSV</button><button class="btn light" data-action="print">چاپ</button></div>
 <div class="card"><div class="table-wrap"><table><thead><tr><th>شماره</th><th>نام مشتری</th><th>تعداد سبد</th><th>فی سبد</th><th>ماه</th><th>مبلغ مجموعی</th><th>مصارف</th><th>مبلغ نهایی</th><th>پرداخت</th><th>عملیات</th></tr></thead><tbody>
 ${rows.length?rows.map((r,i)=>rentRow(r,i)).join(""):`<tr><td colspan="10" class="empty">هنوز رکورد کرایه ثبت نشده است.</td></tr>`}</tbody>
 <tfoot><tr><td colspan="2">جمع</td><td>${num(rows.reduce((a,r)=>a+Number(r.baskets),0))}</td><td>—</td><td>—</td><td>${money(totalRent())}</td><td>${money(totalExpenses())}</td><td>${money(netRent())}</td><td>${money(totalPayments())}</td><td></td></tr></tfoot></table></div></div>
 <div class="section card"><h3>تقسیم مبلغ قابل تقسیم بین شرکا</h3>${sharesValid()?shareCards():`<p class="danger-text">مجموع سهم شرکا باید دقیقاً 100٪ باشد. از صفحه شرکا اصلاح کنید.</p>`}</div>`);
}
function rentRow(r,i){const total=Number(r.baskets)*Number(r.rate)*Number(r.months);r.total=total;const net=total-Number(r.expenses||0);return `<tr><td>${i+1}</td><td>${esc(r.customer)}</td><td>${num(r.baskets)}</td><td>${money(r.rate)}</td><td>${num(r.months)}</td><td>${money(total)}</td><td class="danger-text">-${money(r.expenses||0)}</td><td class="good">${money(net)}</td><td>${money(r.paid||0)}</td><td><button class="btn light" data-action="editRent" data-id="${r.id}">ویرایش</button> <button class="btn danger" data-action="deleteRent" data-id="${r.id}">حذف</button></td></tr>`}

function customersPage(){
 return page("مشتریان",`<div class="actions"><button class="btn accent" data-action="addCustomer">+ مشتری جدید</button></div>
 <input class="search" id="customerSearch" placeholder="جستجوی نام یا شماره تماس">
 <div class="card table-wrap"><table><thead><tr><th>شماره</th><th>نام</th><th>تماس</th><th>طبقه</th><th>سبد</th><th>شروع</th><th>پایان</th><th>بدهی</th><th>عملیات</th></tr></thead><tbody id="customerBody">${customerRows(state.customers)}</tbody></table></div>`);
}
function customerRows(arr){return arr.length?arr.map((c,i)=>`<tr><td>${i+1}</td><td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td>${c.floor}</td><td>${num(c.baskets)}</td><td>${esc(c.start)}</td><td>${esc(c.end)}</td><td>${money(c.debt||0)}</td><td><button class="btn light" data-action="editCustomer" data-id="${c.id}">ویرایش</button> <button class="btn danger" data-action="deleteCustomer" data-id="${c.id}">حذف</button></td></tr>`).join(""):`<tr><td colspan="9" class="empty">مشتری ثبت نشده است.</td></tr>`}

function financePage(){
 return page("مالی",`<div class="grid">${stat("درآمد کرایه",money(totalRent()),"کل قراردادها")}${stat("مصارف",money(totalExpenses()),"ثبت‌شده")}${stat("سود خالص",money(netRent()),"قابل تقسیم")}${stat("پرداخت‌ها",money(totalPayments()),"دریافت‌شده")}</div>
 <div class="section card"><h3>مصارف اخیر</h3><div class="table-wrap"><table><thead><tr><th>تاریخ</th><th>نوع</th><th>مبلغ</th><th>طبقه</th><th>توضیح</th><th></th></tr></thead><tbody>${state.expenses.slice().reverse().slice(0,20).map(e=>`<tr><td>${esc(e.date)}</td><td>${esc(e.category)}</td><td class="danger-text">-${money(e.amount)}</td><td>${e.floor||"مشترک"}</td><td>${esc(e.note)}</td><td><button class="btn danger" data-action="deleteExpense" data-id="${e.id}">حذف</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty">مصرفی ثبت نشده است.</td></tr>`}</tbody></table></div><div class="actions"><button class="btn accent" data-action="addExpense">+ ثبت مصرف</button></div></div>
 <div class="section card"><h3>ورود و خروج مالی</h3><p class="subtitle">برای ثبت دریافت از مشتری از «ثبت پرداخت» استفاده کنید.</p><button class="btn" data-action="addPayment">+ ثبت پرداخت</button></div>`);
}

function toolsPage(){
 return page("ابزار",`<div class="grid">
 <div class="card"><h3>ماشین حساب</h3><div id="calcDisplay" class="card" style="font-size:1.3rem;text-align:left;direction:ltr">0</div><div class="grid grid3" id="calcKeys">${["7","8","9","÷","4","5","6","×","1","2","3","−","0",".","%","+","C","⌫","="].map(x=>`<button class="btn light calc" data-key="${x}">${x}</button>`).join("")}</div></div>
 <div class="card"><h3>تبدیل ارز</h3><div class="field"><label>مبلغ</label><input id="fxAmount" type="number" value="1"></div><div class="field"><label>از</label><select id="fxFrom"><option value="AFN">AFN</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div><div class="field"><label>به</label><select id="fxTo"><option value="USD">USD</option><option value="AFN">AFN</option><option value="EUR">EUR</option></select></div><button class="btn" data-action="convertFx">تبدیل</button><div id="fxResult" class="section"></div></div>
 <div class="card"><h3>تبدیل تاریخ</h3><div class="field"><label>تاریخ میلادی</label><input id="gregDate" type="date"></div><button class="btn" data-action="dateConvert">تبدیل و نمایش</button><div id="dateResult" class="section"></div><p class="subtitle">نمایش تاریخ دری/شمسی و میلادی با امکانات داخلی مرورگر انجام می‌شود.</p></div>
 <div class="card"><h3>کتابچه نوت</h3><div class="field"><label>یادداشت جدید</label><textarea id="noteText" placeholder="یادداشت خود را بنویسید..."></textarea></div><button class="btn accent" data-action="addNote">ذخیره یادداشت</button><div class="section">${state.notes.slice().reverse().map(n=>`<div class="card"><div>${esc(n.text)}</div><small class="subtitle">${esc(n.date)} <button class="btn danger" data-action="deleteNote" data-id="${n.id}">حذف</button></small></div>`).join("")||`<div class="empty">یادداشتی وجود ندارد.</div>`}</div></div>
 </div>`);
}

function settingsPage(){
 const s=state.settings,c=s.colors;
 return page("تنظیمات",`<div class="card"><h3>تنظیمات سردخانه</h3><div class="form-grid">
 <div class="field"><label>نام سردخانه</label><input id="setName" value="${esc(s.name)}"></div>
 <div class="field"><label>ظرفیت طبقه اول</label><input id="cap1" type="number" value="${s.capacity[0]}"></div>
 <div class="field"><label>ظرفیت طبقه دوم</label><input id="cap2" type="number" value="${s.capacity[1]}"></div>
 <div class="field"><label>وزن هر سبد (کیلوگرام)</label><input id="basketWeight" type="number" value="${s.basketWeight}"></div>
 <div class="field"><label>کرایه فی سبد در ماه</label><input id="rentRate" type="number" value="${s.rentRate}"></div>
 <div class="field"><label>دالر به افغانی</label><input id="usd" type="number" value="${s.usd}"></div>
 <div class="field"><label>یورو به افغانی</label><input id="eur" type="number" value="${s.eur}"></div>
 <div class="field"><label>اندازه متن</label><select id="font"><option value="small">کوچک</option><option value="medium">متوسط</option><option value="large">بزرگ</option><option value="xlarge">خیلی بزرگ</option></select></div>
 <div class="field"><label>حالت</label><select id="theme"><option value="light">روشن</option><option value="dark">تاریک</option></select></div>
 </div><button class="btn accent" data-action="saveSettings">ذخیره تنظیمات</button></div>
 <div class="section card"><h3>رنگ‌ها</h3><div class="form-grid">${colorInput("primary","رنگ اصلی",c.primary)}${colorInput("secondary","رنگ فولادی",c.secondary)}${colorInput("accent","رنگ تأکیدی",c.accent)}${colorInput("bg","پس‌زمینه",c.bg)}${colorInput("card","کارت‌ها",c.card)}${colorInput("text","متن",c.text)}</div></div>
 <div class="section card"><h3>پشتیبان و داده</h3><div class="actions"><button class="btn" data-action="backup">Backup JSON</button><button class="btn secondary" data-action="restore">Restore JSON</button><button class="btn light" data-action="exportAll">CSV داده‌ها</button><button class="btn danger" data-action="reset">پاک‌کردن همه اطلاعات</button></div></div>
 <div class="section card"><h3>رمز ورود</h3><p class="subtitle">برای نسخه فعلی، PIN روی همین دستگاه نگهداری می‌شود.</p><button class="btn" data-action="setPin">تغییر PIN</button></div>`);
}
function colorInput(id,label,val){return `<div class="field"><label>${label}</label><input id="color_${id}" type="color" value="${val}"></div>`}

function openModal(title,body){document.getElementById("modalTitle").textContent=title;document.getElementById("modalBody").innerHTML=body;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function formButton(text,action){return `<div class="actions"><button class="btn accent" data-action="${action}">${text}</button><button class="btn light" data-action="closeModal">انصراف</button></div>`}

function bindPage(){
 document.querySelectorAll(".calc").forEach(b=>b.onclick=()=>calcPress(b.dataset.key));
 const search=document.getElementById("customerSearch"); if(search) search.oninput=()=>document.getElementById("customerBody").innerHTML=customerRows(state.customers.filter(c=>(c.name+" "+c.phone).includes(search.value)));
}
function formCustomer(c={}){
 openModal(c.id?"ویرایش مشتری":"مشتری جدید",`<div class="form-grid">
 <div class="field"><label>نام مشتری</label><input id="mName" value="${esc(c.name||"")}"></div>
 <div class="field"><label>شماره تماس</label><input id="mPhone" value="${esc(c.phone||"")}"></div>
 <div class="field"><label>طبقه</label><select id="mFloor"><option value="1" ${c.floor==1?"selected":""}>طبقه اول</option><option value="2" ${c.floor==2?"selected":""}>طبقه دوم</option></select></div>
 <div class="field"><label>تعداد سبد</label><input id="mBaskets" type="number" min="0" value="${c.baskets||0}"></div>
 <div class="field"><label>تاریخ شروع</label><input id="mStart" type="date" value="${c.start||""}"></div>
 <div class="field"><label>تاریخ پایان</label><input id="mEnd" type="date" value="${c.end||""}"></div>
 <div class="field"><label>بدهی</label><input id="mDebt" type="number" value="${c.debt||0}"></div>
 <div class="field full"><label>توضیحات</label><textarea id="mNote">${esc(c.note||"")}</textarea></div></div>${formButton("ذخیره","saveCustomer")}`);
 window.__editing=c.id||null;
}
function saveCustomer(){
 const c={id:window.__editing||uid(),name:document.getElementById("mName").value.trim(),phone:document.getElementById("mPhone").value.trim(),floor:Number(document.getElementById("mFloor").value),baskets:Number(document.getElementById("mBaskets").value),start:document.getElementById("mStart").value,end:document.getElementById("mEnd").value,debt:Number(document.getElementById("mDebt").value),note:document.getElementById("mNote").value};
 if(!c.name||c.baskets<0)return toast("نام مشتری و تعداد سبد را درست وارد کنید.");
 const idx=state.customers.findIndex(x=>x.id===c.id); if(idx>=0)state.customers[idx]=c;else state.customers.push(c);save();closeModal();toast("مشتری با موفقیت ذخیره شد");render();
}
function formRent(r={}){
 openModal(r.id?"ویرایش کرایه":"افزودن رکورد کرایه",`<div class="form-grid">
 <div class="field"><label>نام مشتری</label><input id="rCustomer" value="${esc(r.customer||"")}"></div>
 <div class="field"><label>تعداد سبد</label><input id="rBaskets" type="number" value="${r.baskets||0}"></div>
 <div class="field"><label>فی سبد/ماه</label><input id="rRate" type="number" value="${r.rate??state.settings.rentRate}"></div>
 <div class="field"><label>تعداد ماه</label><input id="rMonths" type="number" value="${r.months||1}"></div>
 <div class="field"><label>مصارف این رکورد</label><input id="rExpenses" type="number" value="${r.expenses||0}"></div>
 <div class="field"><label>پرداخت‌شده</label><input id="rPaid" type="number" value="${r.paid||0}"></div>
 <div class="field full"><label>توضیحات</label><textarea id="rNote">${esc(r.note||"")}</textarea></div></div>${formButton("ذخیره","saveRent")}`);
 window.__editing=r.id||null;
}
function saveRent(){
 const r={id:window.__editing||uid(),customer:document.getElementById("rCustomer").value.trim(),baskets:Number(document.getElementById("rBaskets").value),rate:Number(document.getElementById("rRate").value),months:Number(document.getElementById("rMonths").value),expenses:Number(document.getElementById("rExpenses").value),paid:Number(document.getElementById("rPaid").value),note:document.getElementById("rNote").value};
 if(!r.customer||r.baskets<0||r.rate<0||r.months<=0||r.expenses<0||r.paid<0)return toast("مقادیر کرایه را درست وارد کنید.");
 const idx=state.rentRows.findIndex(x=>x.id===r.id);if(idx>=0)state.rentRows[idx]=r;else state.rentRows.push(r);
 save();closeModal();toast("حساب کرایه ذخیره شد");render();
}
function formExpense(){
 openModal("ثبت مصرف",`<div class="form-grid"><div class="field"><label>تاریخ</label><input id="eDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
 <div class="field"><label>نوع مصرف</label><select id="eCat">${["برق","دیزل","جنراتور","کارگر","تعمیرات","کمپرسور","گاز سردکننده","روغن","آب","بسته‌بندی","صندوق/سبد","انتقالات","بارگیری","تخلیه","مواد ضدعفونی","تعمیر ساختمان","کرایه","سایر"].map(x=>`<option>${x}</option>`).join("")}</select></div>
 <div class="field"><label>مبلغ</label><input id="eAmount" type="number" min="0"></div><div class="field"><label>طبقه</label><select id="eFloor"><option value="">مشترک</option><option>1</option><option>2</option></select></div><div class="field full"><label>توضیحات</label><textarea id="eNote"></textarea></div></div>${formButton("ثبت مصرف","saveExpense")}`);
}
function saveExpense(){const e={id:uid(),date:document.getElementById("eDate").value,category:document.getElementById("eCat").value,amount:Number(document.getElementById("eAmount").value),floor:document.getElementById("eFloor").value,note:document.getElementById("eNote").value};if(e.amount<=0)return toast("مبلغ مصرف باید بیشتر از صفر باشد.");state.expenses.push(e);save();closeModal();toast("مصرف ثبت شد");render()}
function formMovement(f,type){
 const customerOpts=state.customers.filter(c=>Number(c.floor)===f).map(c=>`<option>${esc(c.name)}</option>`).join("");
 openModal(type==="in"?"ورود سیب":"خروج سیب",`<div class="form-grid"><div class="field"><label>طبقه</label><input id="mvFloor" value="${f}" disabled></div><div class="field"><label>مشتری</label><select id="mvCustomer"><option value="">شخصی/شرکا</option>${customerOpts}</select></div><div class="field"><label>تعداد سبد</label><input id="mvBaskets" type="number" min="1"></div><div class="field"><label>وزن هر سبد</label><input id="mvWeight" type="number" value="${state.settings.basketWeight}"></div><div class="field"><label>شماره رسید</label><input id="mvReceipt"></div><div class="field"><label>تاریخ</label><input id="mvDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field full"><label>توضیحات</label><textarea id="mvNote"></textarea></div></div>${formButton("ثبت","saveMovement")}`);
 window.__movement={floor:f,type};
}
function saveMovement(){
 const x=window.__movement,b=Number(document.getElementById("mvBaskets").value),w=Number(document.getElementById("mvWeight").value);
 if(b<=0||w<=0)return toast("تعداد و وزن باید بیشتر از صفر باشد.");
 const used=capacityUsed(x.floor),cap=Number(state.settings.capacity[x.floor-1]);
 if(x.type==="in"&&used+b>cap)return toast("ظرفیت این طبقه کافی نیست.");
 if(x.type==="out"&&b>used)return toast("خروج بیشتر از موجودی مجاز نیست.");
 state.movements.push({id:uid(),floor:x.floor,type:x.type,baskets:b,weight:w,customer:document.getElementById("mvCustomer").value,date:document.getElementById("mvDate").value,receipt:document.getElementById("mvReceipt").value,note:document.getElementById("mvNote").value});
 save();closeModal();toast("عملیات با موفقیت ثبت شد");render();
}
function formPayment(){
 openModal("ثبت پرداخت",`<div class="form-grid"><div class="field"><label>نام مشتری/پرداخت‌کننده</label><input id="pName"></div><div class="field"><label>مبلغ</label><input id="pAmount" type="number" min="0"></div><div class="field"><label>تاریخ</label><input id="pDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div class="field full"><label>توضیح</label><textarea id="pNote"></textarea></div></div>${formButton("ثبت پرداخت","savePayment")}`);
}
function savePayment(){const p={id:uid(),name:document.getElementById("pName").value,amount:Number(document.getElementById("pAmount").value),date:document.getElementById("pDate").value,note:document.getElementById("pNote").value};if(p.amount<=0)return toast("مبلغ نامعتبر است.");state.payments.push(p);save();closeModal();toast("پرداخت ثبت شد");render()}
function saveSettings(){
 const s=state.settings;s.name=document.getElementById("setName").value.trim()||s.name;s.capacity=[Number(document.getElementById("cap1").value),Number(document.getElementById("cap2").value)];s.basketWeight=Number(document.getElementById("basketWeight").value);s.rentRate=Number(document.getElementById("rentRate").value);s.usd=Number(document.getElementById("usd").value);s.eur=Number(document.getElementById("eur").value);s.font=document.getElementById("font").value;s.theme=document.getElementById("theme").value;
 ["primary","secondary","accent","bg","card","text"].forEach(k=>s.colors[k]=document.getElementById("color_"+k).value);
 if(s.capacity.some(x=>x<0)||s.basketWeight<=0||s.rentRate<0)return toast("تنظیمات ظرفیت و وزن را درست وارد کنید.");
 save();toast("تنظیمات ذخیره شد");render();
}
function calcPress(k){
 const d=document.getElementById("calcDisplay");let v=d.textContent;
 if(k==="C"){d.textContent="0";return} if(k==="⌫"){d.textContent=v.length>1?v.slice(0,-1):"0";return}
 if(k==="="){try{let e=v.replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-").replace(/%/g,"/100");d.textContent=String(Function("return "+e)())}catch{d.textContent="خطا"}return}
 if(v==="0"&&/[0-9.]/.test(k))v="";d.textContent=v+k;
}
function convertFx(){
 const a=Number(document.getElementById("fxAmount").value),from=document.getElementById("fxFrom").value,to=document.getElementById("fxTo").value,s=state.settings;
 const afn={AFN:1,USD:s.usd,EUR:s.eur};const result=a*afn[from]/afn[to];
 document.getElementById("fxResult").innerHTML=`<b>${num(result)} ${to}</b>`;
}
function dateConvert(){
 const d=document.getElementById("gregDate").value;if(!d)return;
 const date=new Date(d+"T12:00:00");const fa=new Intl.DateTimeFormat("fa-AF-u-ca-persian",{dateStyle:"full"}).format(date);
 document.getElementById("dateResult").innerHTML=`<b>${fa}</b><br><span class="subtitle">${date.toLocaleDateString("en-US")}</span>`;
}
function download(name,text,type="application/json"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function backup(){download("coldstore-backup.json",JSON.stringify(state,null,2))}
function restore(){const i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=()=>{const f=i.files[0],r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();toast("Backup بازیابی شد");render()}catch{toast("فایل Backup معتبر نیست")}};r.readAsText(f)};i.click()}
function csv(rows){return rows.map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n")}
function exportRent(){const rows=[["شماره","نام مشتری","سبد","فی سبد","ماه","مجموع","مصارف","نهایی","پرداخت"],...state.rentRows.map((r,i)=>[i+1,r.customer,r.baskets,r.rate,r.months,r.baskets*r.rate*r.months,r.expenses,r.baskets*r.rate*r.months-r.expenses,r.paid])];download("حساب-کرایه.csv","\uFEFF"+csv(rows),"text/csv;charset=utf-8")}
function exportAll(){const rows=[["نوع","شناسه","نام/توضیح","مبلغ","تاریخ"],...state.expenses.map(x=>["مصرف",x.id,x.category,x.amount,x.date]),...state.payments.map(x=>["پرداخت",x.id,x.name,x.amount,x.date])];download("داده-های-مالی.csv","\uFEFF"+csv(rows),"text/csv;charset=utf-8")}
function print(){window.print()}
function addNote(){const t=document.getElementById("noteText").value.trim();if(!t)return toast("متن یادداشت خالی است.");state.notes.push({id:uid(),text:t,date:today()});save();toast("یادداشت ذخیره شد");render()}
function setPin(){const p=prompt("PIN جدید را وارد کنید (۴ تا ۸ رقم):");if(!p||!/^\d{4,8}$/.test(p))return toast("PIN معتبر نیست.");state.settings.pin=p;save();toast("PIN تغییر کرد")}
function reset(){if(confirm("همه اطلاعات پاک شود؟ این کار قابل برگشت نیست مگر Backup داشته باشید.")){localStorage.removeItem(KEY);state=structuredClone(defaultState);save();render();toast("اطلاعات پاک شد")}}

document.addEventListener("click",e=>{
 const b=e.target.closest("[data-action]");if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 if(a==="closeModal")return closeModal();
 if(a==="addCustomer")return formCustomer();
 if(a==="editCustomer")return formCustomer(state.customers.find(x=>x.id===id)||{});
 if(a==="deleteCustomer"){if(confirm("مشتری حذف شود؟")){state.customers=state.customers.filter(x=>x.id!==id);save();render()};return}
 if(a==="addRent")return formRent();
 if(a==="editRent")return formRent(state.rentRows.find(x=>x.id===id)||{});
 if(a==="deleteRent"){if(confirm("این رکورد حذف شود؟")){state.rentRows=state.rentRows.filter(x=>x.id!==id);save();render()};return}
 if(a==="addExpense")return formExpense();
 if(a==="deleteExpense"){if(confirm("مصرف حذف شود؟")){state.expenses=state.expenses.filter(x=>x.id!==id);save();render()};return}
 if(a==="addMovement")return formMovement(Number(b.dataset.floor),b.dataset.type);
 if(a==="addPayment")return formPayment();
 if(a==="saveCustomer")return saveCustomer();
 if(a==="saveRent")return saveRent();
 if(a==="saveExpense")return saveExpense();
 if(a==="saveMovement")return saveMovement();
 if(a==="savePayment")return savePayment();
 if(a==="saveSettings")return saveSettings();
 if(a==="backup")return backup();
 if(a==="restore")return restore();
 if(a==="exportRent")return exportRent();
 if(a==="exportAll")return exportAll();
 if(a==="print")return print();
 if(a==="addNote")return addNote();
 if(a==="deleteNote"){state.notes=state.notes.filter(x=>x.id!==id);save();render();return}
 if(a==="convertFx")return convertFx();
 if(a==="dateConvert")return dateConvert();
 if(a==="setPin")return setPin();
 if(a==="reset")return reset();
});
document.getElementById("modalClose").onclick=closeModal;
document.getElementById("menuBtn").onclick=()=>toast("برای جابه‌جایی از نوار پایین استفاده کنید.");
document.getElementById("lockBtn").onclick=()=>{if(state.settings.pin){const p=prompt("PIN را وارد کنید");if(p!==state.settings.pin)return toast("PIN نادرست است")}toast("برنامه باز است")};
document.getElementById("bottomNav").onclick=e=>{const b=e.target.closest("button[data-page]");if(b){currentPage=b.dataset.page;render()}};
window.addEventListener("load",()=>{if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});render()});
