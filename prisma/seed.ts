/**
 * @module seed
 * @file seed.ts
 * @description Seed data: catálogo completo de vacinas e preventivos para o Brasil.
 */

import { PrismaClient, PetSpecies, VaccineTemplateType, VaccineCategory, PreventiveType } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Vaccine Templates ────────────────────────────────────────────────────────

const vaccineTemplates: Array<{
  name: string
  slug: string
  type: VaccineTemplateType
  species: PetSpecies[]
  category: VaccineCategory
  preventiveType?: PreventiveType
  targetConditions?: string
  minimumAgeWeeks: number
  initialDosesCount: number
  initialIntervalDays: number
  boosterIntervalDays: number
  isRequiredByLaw: boolean
  notes?: string
  brands: Array<{
    brandName: string
    manufacturer: string
    presentation?: string
  }>
}> = [
  // ── CÃES — CORE ────────────────────────────────────────────────────────────

  {
    name: 'V8 / V10 (Múltipla Canina)',
    slug: 'multipla-canina',
    type: 'VACCINE',
    species: ['DOG'],
    category: 'CORE',
    targetConditions: 'Cinomose, Parvovirose, Adenovirose (CAV-2), Parainfluenza, Coronavirose, Leptospirose (4-6 sorovares)',
    minimumAgeWeeks: 6,
    initialDosesCount: 3,
    initialIntervalDays: 21,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Protocolo: 1ª dose com 6-8 semanas, 2ª com 9-11 semanas, 3ª com 12-16 semanas. Reforço anual.',
    brands: [
      { brandName: 'Vanguard Plus 5 L4 CV', manufacturer: 'Zoetis', presentation: 'Frasco liofilizado + diluente 1 mL' },
      { brandName: 'Nobivac DHPPi+L4', manufacturer: 'MSD Animal Health', presentation: 'Frasco liofilizado + diluente 1 mL' },
      { brandName: 'Versiguard DA2PPv+L', manufacturer: 'Zoetis', presentation: 'Frasco liofilizado + diluente 1 mL' },
      { brandName: 'Duramune Max 5-CvK/4L', manufacturer: 'Elanco', presentation: 'Frasco liofilizado + diluente 1 mL' },
      { brandName: 'Canigen DHPPi+L', manufacturer: 'Virbac', presentation: 'Frasco liofilizado + diluente 1 mL' },
    ],
  },

  {
    name: 'Antirrábica Canina',
    slug: 'rabies-dog',
    type: 'VACCINE',
    species: ['DOG'],
    category: 'CORE',
    targetConditions: 'Raiva',
    minimumAgeWeeks: 12,
    initialDosesCount: 1,
    initialIntervalDays: 0,
    boosterIntervalDays: 365,
    isRequiredByLaw: true,
    notes: 'Obrigatória por lei. Reforço anual. Aplicar a partir de 12 semanas (3 meses).',
    brands: [
      { brandName: 'Rabisin', manufacturer: 'Boehringer Ingelheim', presentation: 'Frasco 1 mL' },
      { brandName: 'Nobivac Rabia', manufacturer: 'MSD Animal Health', presentation: 'Frasco 1 mL' },
      { brandName: 'Defensor 3', manufacturer: 'Zoetis', presentation: 'Frasco 1 mL' },
      { brandName: 'Imovax Raiva Vet', manufacturer: 'Sanofi', presentation: 'Frasco 1 mL' },
    ],
  },

  // ── CÃES — NON-CORE ────────────────────────────────────────────────────────

  {
    name: 'Gripe Canina (Bordetela + Parainfluenza)',
    slug: 'gripe-canina',
    type: 'VACCINE',
    species: ['DOG'],
    category: 'NON_CORE',
    targetConditions: 'Tosse dos canis (Bordetella bronchiseptica, Parainfluenza)',
    minimumAgeWeeks: 8,
    initialDosesCount: 2,
    initialIntervalDays: 28,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Recomendada para cães em contato com outros (hotéis, parques, canis). Versão intranasal ou injetável.',
    brands: [
      { brandName: 'Nobivac KC', manufacturer: 'MSD Animal Health', presentation: 'Frasco intranasal 0,4 mL' },
      { brandName: 'Bronchi-Shield III', manufacturer: 'Elanco', presentation: 'Frasco intranasal' },
      { brandName: 'Vanguard B Oral', manufacturer: 'Zoetis', presentation: 'Frasco oral 1 mL' },
    ],
  },

  {
    name: 'Leishmaniose Visceral Canina',
    slug: 'leishmaniose-canina',
    type: 'VACCINE',
    species: ['DOG'],
    category: 'NON_CORE',
    targetConditions: 'Leishmaniose visceral (Leishmania infantum)',
    minimumAgeWeeks: 12,
    initialDosesCount: 3,
    initialIntervalDays: 21,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Recomendada em áreas endêmicas. Única vacina contra leishmaniose aprovada no Brasil. Apenas para cães soronegativos.',
    brands: [
      { brandName: 'Leishmune', manufacturer: 'Zoetis', presentation: 'Frasco 1 mL + adjuvante' },
      { brandName: 'Leish-Tec', manufacturer: 'Hertape Calier', presentation: 'Frasco 1 mL + adjuvante' },
    ],
  },

  {
    name: 'Giardíase Canina',
    slug: 'giardiase-canina',
    type: 'VACCINE',
    species: ['DOG'],
    category: 'NON_CORE',
    targetConditions: 'Giardia duodenalis',
    minimumAgeWeeks: 8,
    initialDosesCount: 2,
    initialIntervalDays: 28,
    boosterIntervalDays: 180,
    isRequiredByLaw: false,
    notes: 'Reforço a cada 6 meses em cães expostos. Eficácia reduz a eliminação de cistos.',
    brands: [
      { brandName: 'GiardiaVax', manufacturer: 'Zoetis', presentation: 'Frasco 1 mL' },
    ],
  },

  // ── GATOS — CORE ──────────────────────────────────────────────────────────

  {
    name: 'Tríplice Felina (Rhinotraqueíte, Calicivírose, Panleucopenia)',
    slug: 'triplice-felina',
    type: 'VACCINE',
    species: ['CAT'],
    category: 'CORE',
    targetConditions: 'Rinotraqueíte (FHV-1), Calicivírose (FCV), Panleucopenia (FPV)',
    minimumAgeWeeks: 6,
    initialDosesCount: 3,
    initialIntervalDays: 21,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Protocolo: 1ª dose com 6-8 semanas, 2ª com 9-11 semanas, 3ª com 12-16 semanas. Reforço anual.',
    brands: [
      { brandName: 'Nobivac Tricat Trio', manufacturer: 'MSD Animal Health', presentation: 'Frasco liofilizado + diluente 1 mL' },
      { brandName: 'Fel-O-Vax PCT', manufacturer: 'Elanco', presentation: 'Frasco 1 mL' },
      { brandName: 'Felocell CVR', manufacturer: 'Zoetis', presentation: 'Frasco liofilizado 1 mL' },
      { brandName: 'Purevax RCPCh', manufacturer: 'Boehringer Ingelheim', presentation: 'Frasco 0,5 mL' },
      { brandName: 'Feligen CRP', manufacturer: 'Virbac', presentation: 'Frasco liofilizado + diluente 1 mL' },
    ],
  },

  {
    name: 'Antirrábica Felina',
    slug: 'rabies-cat',
    type: 'VACCINE',
    species: ['CAT'],
    category: 'CORE',
    targetConditions: 'Raiva',
    minimumAgeWeeks: 12,
    initialDosesCount: 1,
    initialIntervalDays: 0,
    boosterIntervalDays: 365,
    isRequiredByLaw: true,
    notes: 'Obrigatória por lei. Reforço anual. Aplicar a partir de 12 semanas.',
    brands: [
      { brandName: 'Nobivac Rabia', manufacturer: 'MSD Animal Health', presentation: 'Frasco 1 mL' },
      { brandName: 'Rabisin', manufacturer: 'Boehringer Ingelheim', presentation: 'Frasco 1 mL' },
      { brandName: 'Defensor 1', manufacturer: 'Zoetis', presentation: 'Frasco 1 mL' },
    ],
  },

  // ── GATOS — NON-CORE ──────────────────────────────────────────────────────

  {
    name: 'FeLV (Leucemia Felina)',
    slug: 'leucemia-felina',
    type: 'VACCINE',
    species: ['CAT'],
    category: 'NON_CORE',
    targetConditions: 'Leucemia felina (FeLV)',
    minimumAgeWeeks: 8,
    initialDosesCount: 2,
    initialIntervalDays: 21,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Recomendada para gatos com acesso ao exterior ou que convivem com gatos FeLV+. Testar antes de vacinar.',
    brands: [
      { brandName: 'Nobivac FeLV', manufacturer: 'MSD Animal Health', presentation: 'Frasco 1 mL' },
      { brandName: 'Purevax FeLV', manufacturer: 'Boehringer Ingelheim', presentation: 'Frasco 0,5 mL' },
      { brandName: 'Fel-O-Vax Lv-K', manufacturer: 'Elanco', presentation: 'Frasco 1 mL' },
    ],
  },

  {
    name: 'FIV/FeLV (Imunodeficiência + Leucemia Felina)',
    slug: 'fiv-felv-felina',
    type: 'VACCINE',
    species: ['CAT'],
    category: 'NON_CORE',
    targetConditions: 'Imunodeficiência felina (FIV) e Leucemia felina (FeLV)',
    minimumAgeWeeks: 8,
    initialDosesCount: 3,
    initialIntervalDays: 21,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Combina proteção contra FIV e FeLV. Testar antes de vacinar. Para gatos FIV-negativos.',
    brands: [
      { brandName: 'Fel-O-Vax FIV+Lv-K', manufacturer: 'Elanco', presentation: 'Frasco 1 mL' },
    ],
  },

  {
    name: 'Clamidiose Felina',
    slug: 'clamidiose-felina',
    type: 'VACCINE',
    species: ['CAT'],
    category: 'NON_CORE',
    targetConditions: 'Chlamydophila felis (conjuntivite/pneumonia felina)',
    minimumAgeWeeks: 9,
    initialDosesCount: 2,
    initialIntervalDays: 28,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Recomendada para gatos em catteries ou com histórico de clamidiose. Geralmente combinada com tríplice.',
    brands: [
      { brandName: 'Purevax RCPCh', manufacturer: 'Boehringer Ingelheim', presentation: 'Frasco 0,5 mL' },
    ],
  },

  // ── CÃES E GATOS — PREVENTIVOS ────────────────────────────────────────────

  {
    name: 'Antipulgas e Carrapatos (Spot-on)',
    slug: 'antipulgas-carrapatos-spot-on',
    type: 'PREVENTIVE',
    species: ['DOG', 'CAT'],
    category: 'LIFESTYLE',
    preventiveType: 'FLEA_TICK',
    targetConditions: 'Pulgas (Ctenocephalides felis), carrapatos (Rhipicephalus sanguineus, Amblyomma cajennense)',
    minimumAgeWeeks: 8,
    initialDosesCount: 1,
    initialIntervalDays: 0,
    boosterIntervalDays: 30,
    isRequiredByLaw: false,
    notes: 'Aplicar mensalmente. Diversas fórmulas disponíveis — conferir indicação para cão ou gato (nunca usar fipronil em gatos sem indicação específica).',
    brands: [
      { brandName: 'Frontline Plus', manufacturer: 'Boehringer Ingelheim', presentation: 'Pipeta spot-on (P/M/G para cão; único para gato)' },
      { brandName: 'Advantix', manufacturer: 'Bayer/Elanco', presentation: 'Pipeta spot-on — SOMENTE CÃES' },
      { brandName: 'Advantage', manufacturer: 'Bayer/Elanco', presentation: 'Pipeta spot-on (cão e gato)' },
      { brandName: 'Revolution (Selamectina)', manufacturer: 'Zoetis', presentation: 'Pipeta spot-on (cão e gato)' },
      { brandName: 'Stronghold Plus', manufacturer: 'Zoetis', presentation: 'Pipeta spot-on para gatos' },
      { brandName: 'Bravecto Spot-on', manufacturer: 'MSD Animal Health', presentation: 'Pipeta spot-on — cão (3 meses) e gato (2 meses)' },
    ],
  },

  {
    name: 'Antipulgas e Carrapatos (Oral)',
    slug: 'antipulgas-carrapatos-oral',
    type: 'PREVENTIVE',
    species: ['DOG'],
    category: 'LIFESTYLE',
    preventiveType: 'FLEA_TICK',
    targetConditions: 'Pulgas e carrapatos',
    minimumAgeWeeks: 8,
    initialDosesCount: 1,
    initialIntervalDays: 0,
    boosterIntervalDays: 30,
    isRequiredByLaw: false,
    notes: 'Comprimidos orais de isoxazolinas. Bravecto dura 3 meses; Nexgard/Simparico dura 1 mês.',
    brands: [
      { brandName: 'Bravecto (Fluralaner)', manufacturer: 'MSD Animal Health', presentation: 'Comprimido mastigável — cão (90 dias)' },
      { brandName: 'Nexgard (Afoxolaner)', manufacturer: 'Boehringer Ingelheim', presentation: 'Comprimido mastigável (30 dias)' },
      { brandName: 'Simparica (Sarolaner)', manufacturer: 'Zoetis', presentation: 'Comprimido mastigável (30 dias)' },
      { brandName: 'Credelio (Lotilaner)', manufacturer: 'Elanco', presentation: 'Comprimido mastigável (30 dias)' },
      { brandName: 'Nexgard Spectra', manufacturer: 'Boehringer Ingelheim', presentation: 'Comprimido mastigável — pulgas, carrapatos + vermes (30 dias)' },
      { brandName: 'Simparica Trio', manufacturer: 'Zoetis', presentation: 'Comprimido mastigável — pulgas, carrapatos + dirofilária (30 dias)' },
    ],
  },

  {
    name: 'Antipulgas e Carrapatos (Coleira)',
    slug: 'antipulgas-carrapatos-coleira',
    type: 'PREVENTIVE',
    species: ['DOG', 'CAT'],
    category: 'LIFESTYLE',
    preventiveType: 'FLEA_TICK',
    targetConditions: 'Pulgas e carrapatos',
    minimumAgeWeeks: 12,
    initialDosesCount: 1,
    initialIntervalDays: 0,
    boosterIntervalDays: 210,
    isRequiredByLaw: false,
    notes: 'Seresto dura até 8 meses. Verificar indicação específica para cão ou gato.',
    brands: [
      { brandName: 'Seresto (Imidacloprida + Flumetrina)', manufacturer: 'Bayer/Elanco', presentation: 'Coleira (cão até 8 meses; gato até 8 meses)' },
      { brandName: 'Scalibor', manufacturer: 'MSD Animal Health', presentation: 'Coleira para cão — também repele flebótomos (leishmaniose)' },
    ],
  },

  {
    name: 'Vermífugo (Endoparasitas)',
    slug: 'vermifugo',
    type: 'PREVENTIVE',
    species: ['DOG', 'CAT'],
    category: 'LIFESTYLE',
    preventiveType: 'DEWORMER',
    targetConditions: 'Áscaris (Toxocara), tênia (Dipylidium, Echinococcus), ancilóstomos, giárdia',
    minimumAgeWeeks: 2,
    initialDosesCount: 1,
    initialIntervalDays: 0,
    boosterIntervalDays: 90,
    isRequiredByLaw: false,
    notes: 'Aplicar a cada 3 meses em adultos; mensalmente em filhotes até 6 meses. Dosagem por peso.',
    brands: [
      { brandName: 'Drontal Plus (Cão)', manufacturer: 'Bayer/Elanco', presentation: 'Comprimido (por kg) — cão' },
      { brandName: 'Drontal (Gato)', manufacturer: 'Bayer/Elanco', presentation: 'Comprimido (por kg) — gato' },
      { brandName: 'Milbemax', manufacturer: 'Elanco', presentation: 'Comprimido (cão e gato, separado por peso)' },
      { brandName: 'Endogard', manufacturer: 'Virbac', presentation: 'Comprimido (cão) por faixa de peso' },
      { brandName: 'Panacur (Fenbendazol)', manufacturer: 'MSD Animal Health', presentation: 'Grânulos/pasta (cão e gato)' },
      { brandName: 'Vermivet Plus', manufacturer: 'Biovet', presentation: 'Comprimido — cão' },
    ],
  },

  {
    name: 'Preventivo de Dirofilária (Verme do Coração)',
    slug: 'dirofilaria-preventivo',
    type: 'PREVENTIVE',
    species: ['DOG', 'CAT'],
    category: 'NON_CORE',
    preventiveType: 'HEARTWORM',
    targetConditions: 'Dirofilaria immitis (verme do coração)',
    minimumAgeWeeks: 8,
    initialDosesCount: 1,
    initialIntervalDays: 0,
    boosterIntervalDays: 30,
    isRequiredByLaw: false,
    notes: 'Obrigatório em regiões tropicais e subtropicais do Brasil. Testar antes de iniciar. Aplicar mensalmente.',
    brands: [
      { brandName: 'Heartgard Plus (Ivermectina + Pirantel)', manufacturer: 'Boehringer Ingelheim', presentation: 'Comprimido mastigável mensal — cão' },
      { brandName: 'Interceptor (Milbemicina)', manufacturer: 'Elanco', presentation: 'Comprimido mensal — cão e gato' },
      { brandName: 'Revolution (Selamectina)', manufacturer: 'Zoetis', presentation: 'Pipeta spot-on mensal — cão e gato' },
      { brandName: 'Simparica Trio', manufacturer: 'Zoetis', presentation: 'Comprimido mastigável mensal — cão' },
    ],
  },

  // ── AVES ──────────────────────────────────────────────────────────────────

  {
    name: 'Doença de Newcastle (Psittacídeos)',
    slug: 'newcastle-aves',
    type: 'VACCINE',
    species: ['BIRD'],
    category: 'NON_CORE',
    targetConditions: 'Doença de Newcastle (paramixovírus aviário)',
    minimumAgeWeeks: 4,
    initialDosesCount: 2,
    initialIntervalDays: 28,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Indicada para psittacídeos (papagaios, calopsitas, araras) em áreas de risco ou com contato com outras aves. Vacina veterinária adaptada.',
    brands: [
      { brandName: 'Lasota (uso adaptado vet)', manufacturer: 'Ceva Saúde Animal', presentation: 'Frasco multidose — uso em aves de produção, adaptado para pets por veterinário aviário' },
    ],
  },

  {
    name: 'Poliomavírus Aviário (BFD)',
    slug: 'polyomavirus-aves',
    type: 'VACCINE',
    species: ['BIRD'],
    category: 'NON_CORE',
    targetConditions: 'Poliomavírus aviário (Budgerigar Fledgling Disease)',
    minimumAgeWeeks: 4,
    initialDosesCount: 2,
    initialIntervalDays: 28,
    boosterIntervalDays: 365,
    isRequiredByLaw: false,
    notes: 'Indicada para calopsitas, periquitos e psittacídeos. Disponibilidade limitada no Brasil.',
    brands: [
      { brandName: 'Polyoma Vaccine (Psittimune APV)', manufacturer: 'Biomune/Zoetis', presentation: 'Frasco 1 mL — uso exclusivo veterinário aviário' },
    ],
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding vaccine catalog...')

  let created = 0
  let skipped = 0

  for (const tmpl of vaccineTemplates) {
    const { brands, ...templateData } = tmpl

    const existing = await prisma.vaccineTemplate.findUnique({ where: { slug: tmpl.slug } })
    if (existing) {
      skipped++
      continue
    }

    await prisma.vaccineTemplate.create({
      data: {
        ...templateData,
        brands: {
          create: brands,
        },
      },
    })
    created++
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
