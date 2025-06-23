// ---- Auth system และ lockout system เหมือนเดิม ----
function getUsers() {
  return JSON.parse(localStorage.getItem('mf2025_users') || '[]');
}
function setUsers(users) {
  localStorage.setItem('mf2025_users', JSON.stringify(users));
}
function findUserByEmailOrUsername(loginValue) {
  const users = getUsers();
  return users.find(u =>
    u.email.toLowerCase() === loginValue.toLowerCase() ||
    u.username.toLowerCase() === loginValue.toLowerCase()
  );
}
function setCurrentUser(u, remember = true) {
  if (u && remember) localStorage.setItem('mf2025_current_user', JSON.stringify(u));
  else if (u && !remember) sessionStorage.setItem('mf2025_current_user', JSON.stringify(u));
  else {
    localStorage.removeItem('mf2025_current_user');
    sessionStorage.removeItem('mf2025_current_user');
  }
}
function getRememberedUser() {
  let u = localStorage.getItem('mf2025_current_user');
  if (!u) u = sessionStorage.getItem('mf2025_current_user');
  return u ? JSON.parse(u) : null;
}

// ---- LOCKOUT SYSTEM ----
const LOCKOUT_KEY = "mf2025_lockout";
const MAX_FAILS = 3;
const LOCKOUT_MINUTES = 3;
let failCount = 0;
let lockoutUntil = 0;

function setLockout(time) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify({until: time, fail: failCount}));
}
function getLockout() {
  const data = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
  return data;
}
function clearLockout() {
  localStorage.removeItem(LOCKOUT_KEY);
  failCount = 0;
  lockoutUntil = 0;
}

// ---- UI Auth (Login/Register/Forgot) ----
const authForm = document.getElementById('auth-form');
const authMsg = document.getElementById('auth-msg');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authUsernameRow = document.getElementById('auth-username-row');
const authUsernameInput = document.getElementById('auth-username');
const authEmailRow = document.getElementById('auth-email-row');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authPasswordRow = document.getElementById('auth-password-row');
const rememberRow = document.getElementById('remember-row');
const rememberMe = document.getElementById('remember-me');

let authState = 'login';

// ------- LOCKOUT BUTTON / TIMER -------
let lockoutInterval = null;
function updateLockoutUI() {
  const data = getLockout();
  const now = Date.now();
  if (data.until && now < data.until) {
    lockoutUntil = data.until;
    failCount = data.fail || MAX_FAILS;
    lockLoginBtn();
    runLockoutTimer();
  } else {
    clearLockout();
    unlockLoginBtn();
  }
}
function lockLoginBtn() {
  authSubmitBtn.disabled = true;
  authSubmitBtn.style.opacity = "0.55";
  authSubmitBtn.style.cursor = "not-allowed";
}
function unlockLoginBtn() {
  authSubmitBtn.disabled = false;
  authSubmitBtn.style.opacity = "";
  authSubmitBtn.style.cursor = "";
  if (lockoutInterval) clearInterval(lockoutInterval);
  authSubmitBtn.textContent = authState === 'login' ? 'เข้าสู่ระบบ' :
                              authState === 'register' ? 'สมัครสมาชิก' : 'รีเซ็ตรหัสผ่าน';
}
function runLockoutTimer() {
  lockLoginBtn();
  function render() {
    const now = Date.now();
    let diff = Math.max(0, Math.floor((lockoutUntil - now)/1000));
    let min = Math.floor(diff/60);
    let sec = diff%60;
    authSubmitBtn.textContent = `โปรดลองอีกครั้งใน ${min}:${('0'+sec).slice(-2)}`;
    if (diff <= 0) {
      unlockLoginBtn();
      clearLockout();
      showLogin();
    }
  }
  render();
  if (lockoutInterval) clearInterval(lockoutInterval);
  lockoutInterval = setInterval(render, 1000);
}

// ------- หน้า Login/Register/Forgot -------
function showLogin() {
  authState = 'login';
  authTitle.textContent = 'เข้าสู่ระบบ';
  authSubmitBtn.textContent = 'เข้าสู่ระบบ';
  authUsernameRow.style.display = 'none';
  authEmailRow.style.display = '';
  authPasswordRow.style.display = '';
  rememberRow.style.display = '';
  rememberMe.checked = false;
  document.getElementById('switch-login').style.display = "none";
  document.getElementById('switch-register').style.display = "";
  document.getElementById('switch-forgot').style.display = "";
  authMsg.textContent = '';
  authForm.reset();
  updateLockoutUI();
}
function showRegister() {
  authState = 'register';
  authTitle.textContent = 'สมัครสมาชิก';
  authSubmitBtn.textContent = 'สมัครสมาชิก';
  authUsernameRow.style.display = '';
  authEmailRow.style.display = '';
  authPasswordRow.style.display = '';
  rememberRow.style.display = 'none';
  document.getElementById('switch-login').style.display = "";
  document.getElementById('switch-register').style.display = "none";
  document.getElementById('switch-forgot').style.display = "";
  authMsg.textContent = '';
  authForm.reset();
  unlockLoginBtn();
}
function showForgot() {
  authState = 'forgot';
  authTitle.textContent = 'ลืมรหัสผ่าน';
  authSubmitBtn.textContent = 'รีเซ็ตรหัสผ่าน';
  authUsernameRow.style.display = 'none';
  authEmailRow.style.display = '';
  authPasswordRow.style.display = '';
  rememberRow.style.display = 'none';
  document.getElementById('switch-login').style.display = "";
  document.getElementById('switch-register').style.display = "";
  document.getElementById('switch-forgot').style.display = "none";
  authMsg.textContent = '';
  authForm.reset();
  unlockLoginBtn();
}

document.getElementById('switch-login').onclick = showLogin;
document.getElementById('switch-register').onclick = showRegister;
document.getElementById('switch-forgot').onclick = showForgot;

document.getElementById('toggle-pw').onclick = function(){
  authPasswordInput.type = authPasswordInput.type === 'password' ? 'text' : 'password';
};

authForm.onsubmit = function(e) {
  e.preventDefault();
  authMsg.style.color = "#fb5c5c";
  authMsg.textContent = '';

  // เช็ค lockout
  const data = getLockout();
  if (authState === 'login' && data.until && Date.now() < data.until) {
    updateLockoutUI();
    return;
  }

  // --- LOGIN ---
  if (authState === 'login') {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;
    if (!email) return authMsg.textContent = 'กรอกอีเมล';
    if (!password) return authMsg.textContent = 'กรอกรหัสผ่าน';
    const user = findUserByEmailOrUsername(email);
    if (!user) {
      failCount++;
      authMsg.textContent = 'ไม่พบผู้ใช้';
    } else if (user.password !== password) {
      failCount++;
      authMsg.textContent = 'รหัสผ่านไม่ถูกต้อง';
    } else {
      // สำเร็จ
      clearLockout();
      setCurrentUser(user, rememberMe.checked);
      authMsg.style.color = "#32e27b";
      authMsg.textContent = "เข้าสู่ระบบสำเร็จ!";
      setTimeout(()=>{
        document.getElementById('auth-root').style.display = 'none';
        document.getElementById('dashboard-root').style.display = '';
        document.getElementById('main-menu-bar').style.display = "flex";
        renderHistory();
        renderMenuDropdown();
      }, 800);
      return;
    }
    if (failCount >= MAX_FAILS) {
      let until = Date.now() + LOCKOUT_MINUTES*60*1000;
      setLockout(until);
      updateLockoutUI();
      authMsg.textContent = 'ป้อนรหัสผิดเกิน 3 ครั้ง กรุณารอ 3 นาที';
    } else {
      setLockout(0);
    }
    return;
  }
  // --- REGISTER ---
  else if (authState === 'register') {
    const username = authUsernameInput.value.trim();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;
    if (!username) return authMsg.textContent = 'กรอกชื่อผู้ใช้';
    if (!email) return authMsg.textContent = 'กรอกอีเมล';
    if (!password) return authMsg.textContent = 'กรอกรหัสผ่าน';
    if (findUserByEmailOrUsername(email) || findUserByEmailOrUsername(username))
      return authMsg.textContent = 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว';
    const users = getUsers();
    users.push({ username, email, password });
    setUsers(users);
    authMsg.style.color = "#32e27b";
    authMsg.textContent = "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ";
    setTimeout(showLogin, 1200);
  }
  // --- FORGOT ---
  else if (authState === 'forgot') {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;
    if (!email) return authMsg.textContent = 'กรอกอีเมล';
    if (!password) return authMsg.textContent = 'กรอกรหัสผ่านใหม่';
    const users = getUsers();
    const idx = users.findIndex(u =>
      u.email.toLowerCase() === email.toLowerCase()
    );
    if (idx === -1) return authMsg.textContent = 'ไม่พบอีเมลในระบบ';
    users[idx].password = password;
    setUsers(users);
    authMsg.style.color = "#32e27b";
    authMsg.textContent = "รีเซ็ตรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบ";
    setTimeout(showLogin, 1200);
  }
};
showLogin();

// ---- ระบบรายรับรายจ่าย ----
function getCurrentUser() {
  return getRememberedUser();
}
function getCurrentUserEmail() {
  const u = getCurrentUser();
  return u ? u.email : '';
}
function getCurrentUsername() {
  const u = getCurrentUser();
  return u ? (u.username || u.email) : '';
}
function getTransKey() {
  return 'mf2025_trans_' + btoa(getCurrentUserEmail());
}
function getTransList() {
  return JSON.parse(localStorage.getItem(getTransKey()) || '[]');
}
function setTransList(list) {
  localStorage.setItem(getTransKey(), JSON.stringify(list));
}
function renderHistory() {
  const list = getTransList();
  let tbody = document.getElementById('history-tbody');
  tbody.innerHTML = '';
  let totalIncome = 0, totalExpense = 0;
  list.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.date || ''}</td>
      <td style="color:${item.type==='income'?'#32e27b':'#fb5c5c'}">${item.type==='income'?'รายรับ':'รายจ่าย'}</td>
      <td>${item.desc || ''}</td>
      <td>${parseFloat(item.amount).toFixed(2)}</td>
      <td><button onclick="deleteTrans(${i})">ลบ</button></td>
    `;
    tbody.appendChild(tr);
    if(item.type==='income') totalIncome += parseFloat(item.amount||0);
    else totalExpense += parseFloat(item.amount||0);
  });
  document.getElementById('total-income').textContent = 'รายรับ: ' + totalIncome.toFixed(2);
  document.getElementById('total-expense').textContent = 'รายจ่าย: ' + totalExpense.toFixed(2);
  document.getElementById('total-balance').textContent = 'คงเหลือ: ' + (totalIncome-totalExpense).toFixed(2);
}
window.deleteTrans = function(idx) {
  const list = getTransList();
  list.splice(idx,1);
  setTransList(list);
  renderHistory();
}
const addForm = document.getElementById('add-form');
if(addForm) addForm.onsubmit = function(e){
  e.preventDefault();
  const type = document.getElementById('type-input').value;
  const desc = document.getElementById('desc-input').value.trim();
  const amount = parseFloat(document.getElementById('amount-input').value);
  const date = document.getElementById('date-input').value;
  if(!desc) return alert('กรอกรายละเอียด');
  if(!amount || amount<=0) return alert('กรอกจำนวนเงินที่ถูกต้อง');
  const list = getTransList();
  list.unshift({type, desc, amount, date});
  setTransList(list);
  addForm.reset();
  renderHistory();
  renderMenuDropdown();
};
// logout
const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) logoutBtn.onclick = function() {
  setCurrentUser(null);
  document.getElementById('dashboard-root').style.display = 'none';
  document.getElementById('auth-root').style.display = '';
  document.getElementById('main-menu-bar').style.display = "none";
  showLogin();
};

// ---- ปุ่มสามขีด (Online/Offline Google style) ----
let isOnlineMode = true;
function renderMenuDropdown() {
  const menuDropdown = document.getElementById('menu-dropdown');
  menuDropdown.innerHTML = `
    <div style="margin-bottom:8px;">
      <button id="btn-toggle-online" class="google-btn" type="button">
        <span class="google-toggle" style="background:${isOnlineMode ? '#34a853':'#e53935'};">
          <span class="google-circle" style="left:${isOnlineMode ? '22px':'2px'};background:#fff;"></span>
        </span>
        <span style="margin-left:12px;font-weight:600;">
          ${isOnlineMode ? 'ออนไลน์' : 'ออฟไลน์'}
        </span>
      </button>
    </div>
  `;
  document.getElementById('btn-toggle-online').onclick = function () {
    setOnlineMode(!isOnlineMode);
    renderMenuDropdown();
  };
}
function setOnlineMode(online) {
  isOnlineMode = online;
  const inputs = document.querySelectorAll('#add-form input, #add-form select, #add-form button[type="submit"]');
  inputs.forEach(input => {
    input.disabled = !online;
    input.style.opacity = online ? "" : "0.6";
    input.style.cursor = online ? "" : "not-allowed";
  });
  let offlineWarn = document.getElementById('offline-warning');
  if(!online) {
    if(!offlineWarn) {
      offlineWarn = document.createElement('div');
      offlineWarn.id = 'offline-warning';
      offlineWarn.style.color = "#fb5c5c";
      offlineWarn.style.margin = "3px 0 7px 0";
      offlineWarn.style.textAlign = "center";
      offlineWarn.textContent = "โหมดออฟไลน์: ไม่สามารถบันทึกรายการได้";
      document.getElementById('add-form').parentNode.insertBefore(offlineWarn, document.getElementById('add-form'));
    }
  } else {
    if(offlineWarn) offlineWarn.remove();
  }
}

// --- เมนูสามขีด dropdown ---
document.getElementById('menu-btn').onclick = function(e) {
  e.stopPropagation();
  const menuDropdown = document.getElementById('menu-dropdown');
  if (menuDropdown) {
    const isShow = menuDropdown.style.display === 'block';
    menuDropdown.style.display = isShow ? 'none' : 'block';
    if (!isShow) renderMenuDropdown();
  }
};
document.body.addEventListener('click', function () {
  const menuDropdown = document.getElementById('menu-dropdown');
  if (menuDropdown) menuDropdown.style.display = 'none';
});
// --- onload ---
window.onload = function(){
  if(getRememberedUser()){
    document.getElementById('auth-root').style.display = 'none';
    document.getElementById('dashboard-root').style.display = '';
    document.getElementById('main-menu-bar').style.display = "flex";
    renderHistory();
    renderMenuDropdown();
  } else {
    document.getElementById('main-menu-bar').style.display = "none";
  }
};
