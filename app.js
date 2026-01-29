const SUPABASE_URL = 'https://sfcenganexujlddaboaa.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmY2VuZ2FuZXh1amxkZGFib2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODIxNzMsImV4cCI6MjA4NTE1ODE3M30.GWQLQzOSZkiQU3D8KNcCUFNvgvrjgYntYe5ZyHf6Iwg'

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)

async function vote(option) {
  await supabase.from('votes').insert([{ option }])
  loadResult()
}

async function loadResult() {
  const { data } = await supabase
    .from('votes')
    .select('option')

  const count = {}
  data.forEach(v => {
    count[v.option] = (count[v.option] || 0) + 1
  })

  const result = document.getElementById('result')
  result.innerHTML = ''

  for (const key in count) {
    const li = document.createElement('li')
    li.textContent = `${key}：${count[key]} 票`
    result.appendChild(li)
  }
}

loadResult()
