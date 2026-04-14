import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const clinics = [
  {
    name: '敦品動物醫院',
    district: '大安區',
    address: '瑞安街124號',
    phone: '02-2707-0877',
    specialty_tags: ['牙科', '根管治療', '牙周病'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '弘吉獸醫院',
    district: '大安區',
    address: '大安區',
    phone: '02-27410958',
    specialty_tags: ['牙科', '洗牙'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '白牙動物醫院',
    district: '信義區',
    address: '信義區',
    phone: '02-27653690',
    specialty_tags: ['牙科', '眼科', '心臟科'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '常明動物醫院',
    district: '大安區',
    address: '復興南路二段322號1樓',
    phone: '02-27030809',
    specialty_tags: ['眼科', '白內障', '青光眼'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '路米動物醫院',
    district: '中山區',
    address: '民生合江路口',
    phone: '02-25163328',
    specialty_tags: ['眼科', '心臟科', '腫瘤科', '化療', '神經科', '泌尿科'],
    is_24h: false,
    is_appointment: true,
    pet_types: ['both'],
  },
  {
    name: '汎亞動物醫院',
    district: '士林區',
    address: '承德路四段183號',
    phone: '02-28826655',
    specialty_tags: ['眼科', '外科', '腫瘤科', '骨科', '神經外科'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '上群動物醫院',
    district: '中山區',
    address: '南京東路三段215號',
    phone: '02-27753007',
    specialty_tags: ['心臟科', '眼科', '皮膚科', '腫瘤科'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '綠洲動物醫院',
    district: '中正區',
    address: '北平東路16號1樓',
    phone: '02-23912220',
    specialty_tags: ['腫瘤科'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '沐恩動物醫院',
    district: '大安區',
    address: '辛亥路一段86號',
    phone: '02-23660203',
    specialty_tags: ['外科', '骨科', '神經外科', '腫瘤外科'],
    is_24h: false,
    is_appointment: true,
    pet_types: ['both'],
  },
  {
    name: '樂膚莉動物醫院',
    district: '大安區',
    address: '仁愛路三段82號',
    phone: '02-2784-6866',
    specialty_tags: ['皮膚科', '過敏', '藥浴'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '伊甸園動物醫院',
    district: '中山區',
    address: '北安路554巷33號1樓',
    phone: '02-8509-2579',
    specialty_tags: ['24H急診', '重症加護'],
    is_24h: true,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '大安動物醫院',
    district: '中正區',
    address: '新生南路一段162號',
    phone: '02-23581199',
    specialty_tags: ['24H急診', '重症加護'],
    is_24h: true,
    is_appointment: false,
    pet_types: ['both'],
  },
  {
    name: '台大動物醫院',
    district: '大安區',
    address: '基隆路三段153號',
    phone: '02-27396828',
    specialty_tags: ['牙科', '眼科', '心臟科', '腫瘤科', '骨科', '神經科'],
    is_24h: false,
    is_appointment: false,
    pet_types: ['both'],
  },
]

const symptoms = [
  // 牙科
  { keyword: '口臭', specialty_tag: '牙科', pet_type: 'both' },
  { keyword: '掉牙', specialty_tag: '牙科', pet_type: 'both' },
  { keyword: '不吃東西', specialty_tag: '牙科', pet_type: 'both' },
  { keyword: '牙齦紅腫', specialty_tag: '牙科', pet_type: 'both' },
  // 眼科
  { keyword: '眼屎多', specialty_tag: '眼科', pet_type: 'both' },
  { keyword: '眼睛紅', specialty_tag: '眼科', pet_type: 'both' },
  { keyword: '白內障', specialty_tag: '眼科', pet_type: 'both' },
  { keyword: '青光眼', specialty_tag: '眼科', pet_type: 'both' },
  // 心臟科
  { keyword: '咳嗽不停', specialty_tag: '心臟科', pet_type: 'both' },
  { keyword: '容易喘', specialty_tag: '心臟科', pet_type: 'both' },
  { keyword: '心雜音', specialty_tag: '心臟科', pet_type: 'both' },
  // 骨科
  { keyword: '跛行', specialty_tag: '骨科', pet_type: 'both' },
  { keyword: '走路歪', specialty_tag: '骨科', pet_type: 'both' },
  { keyword: '骨折', specialty_tag: '骨科', pet_type: 'both' },
  // 腫瘤科
  { keyword: '腫塊', specialty_tag: '腫瘤科', pet_type: 'both' },
  { keyword: '癌症', specialty_tag: '腫瘤科', pet_type: 'both' },
  { keyword: '化療', specialty_tag: '腫瘤科', pet_type: 'both' },
  // 皮膚科
  { keyword: '一直抓', specialty_tag: '皮膚科', pet_type: 'both' },
  { keyword: '掉毛', specialty_tag: '皮膚科', pet_type: 'both' },
  { keyword: '皮膚紅疹', specialty_tag: '皮膚科', pet_type: 'both' },
  // 神經科
  { keyword: '抽搐', specialty_tag: '神經科', pet_type: 'both' },
  { keyword: '癲癇', specialty_tag: '神經科', pet_type: 'both' },
  { keyword: '突然癱瘓', specialty_tag: '神經科', pet_type: 'both' },
  // 泌尿科
  { keyword: '血尿', specialty_tag: '泌尿科', pet_type: 'both' },
  { keyword: '尿不出來', specialty_tag: '泌尿科', pet_type: 'both' },
  // 腎臟科
  { keyword: '腎衰竭', specialty_tag: '腎臟科', pet_type: 'both' },
  // 24H急診
  { keyword: '昏倒', specialty_tag: '24H急診', pet_type: 'both' },
  { keyword: '呼吸困難', specialty_tag: '24H急診', pet_type: 'both' },
  { keyword: '半夜急診', specialty_tag: '24H急診', pet_type: 'both' },
]

async function seed() {
  console.log('Seeding clinics...')
  const { error: clinicError } = await supabase.from('clinics').upsert(clinics, {
    onConflict: 'name',
  })
  if (clinicError) {
    // If upsert on name fails (no unique constraint), try delete + insert
    console.log('Upsert failed, trying delete + insert...')
    await supabase.from('clinics').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { error } = await supabase.from('clinics').insert(clinics)
    if (error) {
      console.error('Failed to seed clinics:', error.message)
      process.exit(1)
    }
  }
  console.log(`✓ Inserted ${clinics.length} clinics`)

  console.log('Seeding symptoms...')
  const { error: symptomDeleteError } = await supabase
    .from('symptoms')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (symptomDeleteError) {
    console.error('Failed to clear symptoms:', symptomDeleteError.message)
  }
  const { error: symptomError } = await supabase.from('symptoms').insert(symptoms)
  if (symptomError) {
    console.error('Failed to seed symptoms:', symptomError.message)
    process.exit(1)
  }
  console.log(`✓ Inserted ${symptoms.length} symptoms`)

  console.log('Seed complete!')
}

seed()
