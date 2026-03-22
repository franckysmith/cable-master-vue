/**
 * Script d'import de fiches techniques microphones (PDF)
 *
 * Usage: node scripts/import-mics.mjs
 *
 * - Lit les PDFs du dossier source
 * - Extrait les infos (marque, modèle, type, directivité, fréquence...)
 * - Upload le PDF dans Supabase Storage
 * - Crée l'entrée dans la table cable
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'

// Config Supabase
const SUPABASE_URL = 'https://sbsygqfhszhcocdnuonp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNic3lncWZoc3poY29jZG51b25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODUzMjUsImV4cCI6MjA4OTM2MTMyNX0.HFMYvwjKa702NK34nI-eUWPnAD3fw8qLNTZ-EJxedjM'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const PDF_DIR = '/Users/franckrichard/Pictures/Library stageplot/Library Microphones/FAIT/pdf-fait/'
const BUCKET = 'microphones'

// Données extraites manuellement des PDFs (à compléter)
const micDatabase = {}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.find(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) {
      console.error('Erreur création bucket:', error.message)
      // Le bucket existe peut-être déjà avec RLS
    }
  }
  console.log(`Bucket "${BUCKET}" prêt`)
}

async function uploadPdf(filename) {
  const filepath = join(PDF_DIR, filename)
  const fileBuffer = readFileSync(filepath)
  const storagePath = `pdfs/${filename}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    console.error(`  Erreur upload ${filename}:`, error.message)
    return null
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  return urlData?.publicUrl || null
}

async function importMic(filename, specs) {
  console.log(`\nImport: ${specs.brand} ${specs.name}`)

  // Upload PDF
  const pdfUrl = await uploadPdf(filename)
  if (pdfUrl) {
    console.log(`  PDF: ${pdfUrl}`)
  }

  // Vérifier si le câble existe déjà
  const { data: existing } = await supabase
    .from('cable')
    .select('cableid')
    .eq('name', specs.name)
    .limit(1)

  if (existing?.length > 0) {
    // Mettre à jour
    const { error } = await supabase
      .from('cable')
      .update({
        brand: specs.brand,
        type: 'microphone',
        info: specs.info,
        link: pdfUrl || specs.link || '',
        weight: specs.weight || 0,
      })
      .eq('cableid', existing[0].cableid)

    if (error) console.error(`  Erreur update:`, error.message)
    else console.log(`  Mis à jour (id: ${existing[0].cableid})`)
  } else {
    // Créer dans le catalogue bibliothèque (id: 2)
    const { data, error } = await supabase
      .from('cable')
      .insert({
        name: specs.name,
        type: 'microphone',
        brand: specs.brand,
        info: specs.info,
        link: pdfUrl || '',
        weight: specs.weight || 0,
        sortno: 0,
        total: 0,
        reserved: 0,
        catalog_id: 2,
      })
      .select()

    if (error) console.error(`  Erreur insert:`, error.message)
    else console.log(`  Créé (id: ${data?.[0]?.cableid})`)
  }
}

// ---- DONNÉES DES MICROS (extraites des PDFs) ----

const mics = [
  {
    file: 'audix_d2_ft.pdf',
    brand: 'Audix',
    name: 'Audix D2',
    info: 'Dynamique | Hypercardioïde | 68Hz-18kHz | 1.2mV/Pa | 144dB SPL | VLM Type B | Toms, congas, guitare',
    weight: 128,
  },
  {
    file: 'audix_d4_ft.pdf',
    brand: 'Audix',
    name: 'Audix D4',
    info: 'Dynamique | Hypercardioïde | 40Hz-18kHz | 1.4mV/Pa | 144dB SPL | VLM Type D | Floor tom, djembé, basse, sax baryton',
    weight: 128,
  },
  {
    file: 'audix_d6_ft.pdf',
    brand: 'Audix',
    name: 'Audix D6',
    info: 'Dynamique | Cardioïde | 30Hz-15kHz | 0.8mV/Pa | 144dB SPL | VLM Type E | Grosse caisse, floor tom, basse',
    weight: 217,
  },
  {
    file: 'SHURE_SM57.pdf',
    brand: 'Shure',
    name: 'SM57',
    info: 'Dynamique | Cardioïde | 40Hz-15kHz | Instrument, caisse claire, ampli',
    weight: 284,
  },
  {
    file: 'SHURE_SM58.pdf',
    brand: 'Shure',
    name: 'SM58',
    info: 'Dynamique | Cardioïde | 50Hz-15kHz | Voix',
    weight: 330,
  },
  {
    file: 'beta52.pdf',
    brand: 'Shure',
    name: 'Beta 52A',
    info: 'Dynamique | Supercardioïde | 20Hz-10kHz | Grosse caisse, basse',
    weight: 594,
  },
  {
    file: 'shure_beta56_ft.pdf',
    brand: 'Shure',
    name: 'Beta 56A',
    info: 'Dynamique | Supercardioïde | 50Hz-16kHz | Instrument, toms, caisse claire',
    weight: 275,
  },
  {
    file: 'shure_beta57a_ft.pdf',
    brand: 'Shure',
    name: 'Beta 57A',
    info: 'Dynamique | Supercardioïde | 50Hz-16kHz | Instrument, ampli',
    weight: 275,
  },
  {
    file: 'shure_beta58A.pdf',
    brand: 'Shure',
    name: 'Beta 58A',
    info: 'Dynamique | Supercardioïde | 50Hz-16kHz | Voix',
    weight: 278,
  },
  {
    file: 'shure_beta98hc.pdf',
    brand: 'Shure',
    name: 'Beta 98HC',
    info: 'Condensateur | Cardioïde | Clip instrument | 11-52V phantom | Cuivres, bois, percussions',
    weight: 28,
  },
  {
    file: 'BETA_87A.pdf',
    brand: 'Shure',
    name: 'Beta 87A',
    info: 'Condensateur | Supercardioïde | 50Hz-20kHz | 2mV/Pa | 140.5dB SPL | 150Ω | 11-52V phantom | Voix live et studio',
    weight: 207,
  },
  {
    file: 'beyerdynamic_m88tg_ft.pdf',
    brand: 'Beyerdynamic',
    name: 'M88 TG',
    info: 'Dynamique | Hypercardioïde | 30Hz-20kHz | 2.9mV/Pa | 200Ω | Grosse caisse, voix, cuivres, broadcast',
    weight: 320,
  },
  {
    file: 'e906-manual-07-2020-fr.pdf',
    brand: 'Sennheiser',
    name: 'e906',
    info: 'Dynamique | Supercardioïde | 40Hz-18kHz | Filtre présence 3 positions | Ampli guitare, instrument',
    weight: 130,
  },
  {
    file: 'sennheiser_md421u4_ft-fr.pdf',
    brand: 'Sennheiser',
    name: 'MD 421-II',
    info: 'Dynamique | Cardioïde | 30Hz-17kHz | Instrument, voix, broadcast',
    weight: 385,
  },
  {
    file: 'electrovoice_re20_ft.pdf',
    brand: 'Electro-Voice',
    name: 'RE20',
    info: 'Dynamique | Cardioïde | 45Hz-18kHz | 1.5mV/Pa | 150Ω | Variable-D | Broadcast, voix, grosse caisse, guitare acoustique',
    weight: 737,
  },
  {
    file: 'c414b_xls_xlII_manual.pdf',
    brand: 'AKG',
    name: 'C414 XLS',
    info: 'Condensateur | Multi-directivité | 20Hz-20kHz | Studio, overhead, instrument',
    weight: 300,
  },
  {
    file: 'dpa_4099_manuel.pdf',
    brand: 'DPA',
    name: 'DPA 4099',
    info: 'Condensateur | Supercardioïde | Clip instrument d:vote | Basse, violoncelle, batterie, guitare, piano, sax, cuivres, violon',
    weight: 40,
  },
  {
    file: 'DPA-Reference-Standard-Mics.pdf',
    brand: 'DPA',
    name: 'DPA Reference',
    info: 'Condensateur | Référence studio et mesure',
    weight: 0,
  },
  {
    file: 'Neuman_KMS104_105.pdf',
    brand: 'Neumann',
    name: 'KMS 104',
    info: 'Condensateur | Cardioïde | 20Hz-20kHz | 4.5mV/Pa | 48V phantom | fet 100 | Voix live haut de gamme',
    weight: 300,
  },
  {
    file: 'Neuman_KMS104_105.pdf',
    brand: 'Neumann',
    name: 'KMS 105',
    info: 'Condensateur | Supercardioïde | 20Hz-20kHz | 4.5mV/Pa | 48V phantom | fet 100 | Voix live haut de gamme',
    weight: 300,
  },
]

// ---- MAIN ----

async function main() {
  console.log('=== Import des fiches techniques microphones ===\n')

  await ensureBucket()

  for (const mic of mics) {
    await importMic(mic.file, mic)
  }

  console.log('\n=== Import terminé ===')
}

main().catch(console.error)
