const SUPABASE_URL = 'https://sfcenganexujlddaboaa.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmY2VuZ2FuZXh1amxkZGFib2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODIxNzMsImV4cCI6MjA4NTE1ODE3M30.GWQLQzOSZkiQU3D8KNcCUFNvgvrjgYntYe5ZyHf6Iwg'

// 使用 supabaseClient 避開全域命名衝突
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)

/* ---------- 畫面切換 ---------- */
function showVoteScreen(user) {
  document.getElementById('login-screen').classList.remove('active')
  document.getElementById('vote-screen').classList.add('active')
  document.getElementById('user-email').textContent = user.email

  loadOptions()
  loadResults()
}

/* ---------- 登入 ---------- */
document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault()

  const email = document.getElementById('email-input').value
  const password = document.getElementById('password-input').value
  const msg = document.getElementById('login-message')

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    msg.textContent = error.message
    msg.classList.add('error')
    return
  }

  msg.textContent = ''
  showVoteScreen(data.user)
})

/* ---------- 登出 ---------- */
document.getElementById('logout-button').addEventListener('click', async () => {
  await supabaseClient.auth.signOut()
  location.reload()
})

/* ---------- 載入選項 ---------- */
async function loadOptions() {
  const { data, error } = await supabaseClient
    .from('options')
    .select('*')
    .order('created_at')

  if (error) return console.error('載入選項失敗:', error)

  const list = document.getElementById('options-list')
  list.innerHTML = ''

  data.forEach(opt => {
    const label = document.createElement('label')
    label.innerHTML = `
      <input type="radio" name="vote" value="${opt.id}">
      ${opt.text}
    `
    list.appendChild(label)
  })
}

/* ---------- 新增選項 ---------- */
document.getElementById('add-option-button').addEventListener('click', async () => {
  const input = document.getElementById('new-option-input')
  const text = input.value.trim()
  if (!text) return

  const { error } = await supabaseClient.from('options').insert([{ text }])
  if (error) return alert('新增失敗，請檢查 RLS 權限')

  input.value = ''
  loadOptions()
})

/* ---------- 投票 ---------- */
document.getElementById('vote-form').addEventListener('submit', async e => {
  e.preventDefault()

  const selected = document.querySelector('input[name="vote"]:checked')
  if (!selected) return alert('請先選擇一個選項')

  const { data: { user } } = await supabaseClient.auth.getUser()

  const { error } = await supabaseClient.from('votes').insert([{
    option_id: selected.value,
    user_id: user.id
  }])

  if (error) return alert('投票失敗，您可能已經投過票了')

  loadResults()
})

/* ---------- 結果 ---------- */
async function loadResults() {
  const { data, error } = await supabaseClient
    .from('votes')
    .select('option_id, options(text)')

  if (error) return console.error('載入結果失敗:', error)

  const count = {}
  data.forEach(v => {
    const t = v.options?.text || '未知選項'
    count[t] = (count[t] || 0) + 1
  })

  const ul = document.getElementById('results')
  ul.innerHTML = ''

  for (const k in count) {
    const li = document.createElement('li')
    li.textContent = `${k}：${count[k]} 票`
    ul.appendChild(li)
  }
}