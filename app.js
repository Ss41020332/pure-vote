const ADMIN_EMAIL = 'steven0844@gmail.com'; // 改成你的管理員信箱
const SUPABASE_URL = 'https://sfcenganexujlddaboaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmY2VuZ2FuZXh1amxkZGFib2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODIxNzMsImV4cCI6MjA4NTE1ODE3M30.GWQLQzOSZkiQU3D8KNcCUFNvgvrjgYntYe5ZyHf6Iwg';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isSignUpMode = false;

/* ---------- 登入/註冊 切換 ---------- */
document.getElementById('toggle-auth').addEventListener('click', (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  document.getElementById('auth-title').textContent = isSignUpMode ? '帳號註冊' : '系統登入';
  document.getElementById('auth-submit-btn').textContent = isSignUpMode ? '註冊' : '登入';
  document.getElementById('toggle-auth').textContent = isSignUpMode ? '已有帳號？前往登入' : '沒有帳號？前往註冊';
  document.getElementById('login-message').textContent = '';
});

/* ---------- 身分驗證邏輯 ---------- */
document.getElementById('auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;
  const msg = document.getElementById('login-message');
  msg.textContent = '讀取中...';

  let result;
  if (isSignUpMode) {
    result = await supabaseClient.auth.signUp({ email, password });
    if (!result.error) {
      alert('註冊成功！系統將為您自動登入');
      // 註冊後直接登入以跳過驗證流程
      const loginRes = await supabaseClient.auth.signInWithPassword({ email, password });
      if (!loginRes.error) showVoteScreen(loginRes.data.user);
    }
  } else {
    result = await supabaseClient.auth.signInWithPassword({ email, password });
    if (!result.error) showVoteScreen(result.data.user);
  }

  if (result.error) {
    msg.textContent = result.error.message;
  }
});

/* ---------- 畫面切換與管理員判斷 ---------- */
function showVoteScreen(user) {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('vote-screen').classList.add('active');
  document.getElementById('user-email').textContent = user.email;

  const isAdmin = user.email === ADMIN_EMAIL;
  document.getElementById('admin-only-section').style.display = isAdmin ? 'block' : 'none';

  loadOptions(isAdmin);
  loadResults();
}

/* ---------- 載入選項清單 ---------- */
async function loadOptions(isAdmin) {
  const { data, error } = await supabaseClient.from('options').select('*').order('created_at');
  if (error) return console.error(error);

  const list = document.getElementById('options-list');
  list.innerHTML = '';

  data.forEach(opt => {
    const div = document.createElement('div');
    div.style = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #f9fafb; padding: 8px; border-radius: 6px;';
    div.innerHTML = `
      <label style="flex: 1; cursor: pointer; margin: 0;">
        <input type="radio" name="vote" value="${opt.id}" style="margin-right: 8px;">
        ${opt.text}
      </label>
      ${isAdmin ? `<button onclick="deleteOption('${opt.id}')" style="background: #ef4444; color: white; padding: 4px 8px; margin: 0; font-size: 12px; border-radius: 4px; border: none; cursor: pointer;">刪除</button>` : ''}
    `;
    list.appendChild(div);
  });
}

/* ---------- 刪除功能 (需配合 SQL CASCADE) ---------- */
window.deleteOption = async (id) => {
  if (!confirm('確定刪除此選項？所有相關票數也會被刪除！')) return;
  const { error } = await supabaseClient.from('options').delete().eq('id', id);
  if (error) {
    alert('刪除失敗，請檢查 SQL Policy');
  } else {
    loadOptions(true);
    loadResults();
  }
};

/* ---------- 新增選項 ---------- */
document.getElementById('add-option-button').addEventListener('click', async () => {
  const input = document.getElementById('new-option-input');
  const text = input.value.trim();
  if (!text) return;

  const { error } = await supabaseClient.from('options').insert([{ text }]);
  if (error) alert('新增失敗：' + error.message);
  else {
    input.value = '';
    loadOptions(true);
  }
});

/* ---------- 投票功能 ---------- */
document.getElementById('vote-form').addEventListener('submit', async e => {
  e.preventDefault();
  const selected = document.querySelector('input[name="vote"]:checked');
  if (!selected) return alert('請先選擇一個選項');

  const { data: { user } } = await supabaseClient.auth.getUser();
  const { error } = await supabaseClient.from('votes').insert([{
    option_id: selected.value,
    user_id: user.id
  }]);

  if (error) alert('投票失敗：您可能已經投過票了');
  else {
    alert('投票成功！');
    loadResults();
  }
});

/* ---------- 載入結果統計 ---------- */
async function loadResults() {
  const { data, error } = await supabaseClient.from('votes').select('option_id, options(text)');
  if (error) return;

  const count = {};
  data.forEach(v => {
    const label = v.options?.text || '(已刪除選項)';
    count[label] = (count[label] || 0) + 1;
  });

  const ul = document.getElementById('results');
  ul.innerHTML = '';
  for (const label in count) {
    const li = document.createElement('li');
    li.style = 'padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;';
    li.innerHTML = `<span>${label}</span> <strong>${count[label]} 票</strong>`;
    ul.appendChild(li);
  }
}

/* ---------- 登出 ---------- */
document.getElementById('logout-button').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});