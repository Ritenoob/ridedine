const { createClient } = require('@supabase/supabase-js')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://exzcczfixfoscgdxebbz.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_dq39hzCvugJtNwlzAxQSaA_dD0ogUnd'
const sb = createClient(url, key)

async function validate() {
  const tables = ['chefs','dishes','orders','drivers','profiles']
  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
    console.log(`${t}: ${error ? 'ERROR - ' + error.message : count + ' rows'}`)
  }
  // Check chefs columns
  const { data, error } = await sb.from('chefs').select('*').limit(1)
  if (data?.[0]) console.log('\nChefs columns:', Object.keys(data[0]).join(', '))
  if (error) console.log('Chefs error:', error.message)
}
validate()
